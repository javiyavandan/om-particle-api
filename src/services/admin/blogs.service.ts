import { Request } from "express"
import dbContext from "../../config/dbContext"
import { ActiveStatus, DeleteStatus, IMAGE_TYPE, Image_type } from "../../utils/app-enumeration"
import { DATA_ALREADY_EXITS, DEFAULT_STATUS_CODE_SUCCESS, DUPLICATE_ERROR_CODE } from "../../utils/app-messages"
import { moveFileToS3ByType } from "../../helpers/file-helper"
import Image from "../../model/image.model"
import { getLocalDate, prepareMessageFromParams, resBadRequest, resSuccess } from "../../utils/shared-functions"
import Blogs from "../../model/blogs.model"

export const addBlog = async (req: Request) => {
    try {
        const {
            title,
            description,
            sort_description,
            session_res
        } = req.body

        const file = req.file

        const duplicate = await Blogs.findOne({ where: { slug: title.toLowerCase().replace(/ /g, "-") } })

        if (duplicate && duplicate.dataValues) {
            return resBadRequest({
                data: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Blog"],
                ]),
            })
        }

        const trn = await dbContext.transaction()
        try {
            let filePath = null;

            if (file) {
                const moveFileResult = await moveFileToS3ByType(
                    file,
                    Image_type.Blog
                );

                if (moveFileResult.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                    return moveFileResult;
                }

                filePath = moveFileResult.data;
            }

            let id_image;
            if (filePath) {
                const imageResult = await Image.create(
                    {
                        image_path: filePath,
                        created_at: getLocalDate(),
                        created_by: session_res.id,
                        is_deleted: DeleteStatus.No,
                        is_active: ActiveStatus.Active,
                        image_type: IMAGE_TYPE.Blog,
                    },
                    { transaction: trn }
                );
                id_image = imageResult.dataValues.id;
            }

            const blogResult = await Blogs.create(
                {
                    title,
                    slug: title.toLowerCase().replace(/ /g, "-"),
                    description,
                    sort_description,
                    id_image,
                    created_at: getLocalDate(),
                    created_by: session_res.id,
                    is_deleted: DeleteStatus.No,
                    is_active: ActiveStatus.Active,
                },
                { transaction: trn }
            );

            await trn.commit()
            return resSuccess({
                message: "Blog added successfully"
            })

        } catch (error) {
            await trn.rollback()
            throw error
        }

    } catch (error) {
        throw error
    }
}