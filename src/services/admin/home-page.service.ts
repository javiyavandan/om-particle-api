import { Request } from "express";
import { ActiveStatus, DeleteStatus, Home_page_sections, IMAGE_TYPE, Image_type, Master_type } from "../../utils/app-enumeration";
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
import { DATA_ALREADY_EXITS, DEFAULT_STATUS_CODE_SUCCESS, DUPLICATE_ERROR_CODE, ERROR_NOT_FOUND, RECORD_DELETED, RECORD_UPDATE, STATUS_UPDATED } from "../../utils/app-messages";
import HomePage from "../../model/home-page.model";
import Master from "../../model/masters.model";
import { moveFileToS3ByType } from "../../helpers/file-helper";
import dbContext from "../../config/dbContext";
import Image from "../../model/image.model";
import { Op, Sequelize } from "sequelize";
import { IMAGE_URL } from "../../config/env.var";

export const addSection = async (req: Request) => {
    try {
        const {
            section_type,
            title,
            sub_title,
            description,
            button_hover_color,
            button_color,
            button_text_color,
            button_name,
            button_text_hover_color,
            is_button_transparent,
            link,
            sort_order,
            hash_tag,
            id_shape,
            alignment,
            session_res,
        } = req.body

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!Object.values(Home_page_sections).includes(section_type)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Section Type"]])
            })
        }

        const isDuplicate = section_type !== Home_page_sections.Banner ? await HomePage.findOne({
            where: {
                title: title,
                section_type: section_type,
                is_deleted: DeleteStatus.No
            }
        }) : null;

        if (isDuplicate && isDuplicate.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Section"],
                ]),
            })
        }

        let id_diamond_shape;

        if (id_shape) {
            const diamondShape = await Master.findOne({
                where: {
                    is_active: ActiveStatus.Active,
                    is_deleted: DeleteStatus.No,
                    master_type: Master_type.Stone_shape,
                    id: id_shape
                }
            })

            if (!(diamondShape && diamondShape.dataValues)) {
                return resNotFound({
                    message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond Shape"]])
                })
            }

            id_diamond_shape = diamondShape.dataValues.id
        }

        const trn = await dbContext.transaction();
        try {
            let id_image
            let id_hover_image

            if (files["image"]) {
                const imageData = await moveFileToS3ByType(
                    files["image"][0],
                    Image_type.HomePage
                )
                if (imageData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                    return imageData;
                }
                const imageResult = await Image.create(
                    {
                        image_path: imageData.data,
                        created_at: getLocalDate(),
                        created_by: req.body.session_res.id,
                        is_deleted: DeleteStatus.No,
                        is_active: ActiveStatus.Active,
                        image_type: IMAGE_TYPE.HomePage,
                    },
                    { transaction: trn }
                );
                id_image = imageResult.dataValues.id;
            }

            if (files["hover_image"]) {
                const imageData = await moveFileToS3ByType(
                    files["image"][0],
                    Image_type.HomePage
                )
                if (imageData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                    return imageData;
                }
                const imageResult = await Image.create(
                    {
                        image_path: imageData.data,
                        created_at: getLocalDate(),
                        created_by: req.body.session_res.id,
                        is_deleted: DeleteStatus.No,
                        is_active: ActiveStatus.Active,
                        image_type: IMAGE_TYPE.HomePage,
                    },
                    { transaction: trn }
                );
                id_hover_image = imageResult.dataValues.id;
            }

            await HomePage.create(
                {
                    section_type: section_type,
                    title: title,
                    sub_title: sub_title,
                    description: description,
                    button_hover_color: button_hover_color,
                    button_color: button_color,
                    button_text_color: button_text_color,
                    button_name: button_name,
                    button_text_hover_color: button_text_hover_color,
                    is_button_transparent: is_button_transparent,
                    link: link,
                    sort_order: sort_order,
                    hash_tag: hash_tag,
                    id_image: id_image,
                    id_hover_image: id_hover_image,
                    id_diamond_shape,
                    alignment,
                    created_by: session_res.id,
                    created_date: getLocalDate(),
                    is_deleted: DeleteStatus.No,
                    is_active: ActiveStatus.Active
                },
                { transaction: trn }
            );

            await trn.commit();
            return resSuccess()
        } catch (error) {
            await trn.rollback();
            throw error
        }

    } catch (error) {
        throw error
    }
}

export const updateSection = async (req: Request) => {
    try {
        const { section_id } = req.params;
        const {
            section_type,
            title,
            sub_title,
            description,
            button_hover_color,
            button_color,
            button_text_color,
            button_name,
            button_text_hover_color,
            is_button_transparent,
            link,
            sort_order,
            hash_tag,
            id_shape,
            alignment,
            session_res,
        } = req.body
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        console.log(files, "filesfilesfilesfiles")
        const findSection = await HomePage.findOne({
            where: {
                id: section_id,
                is_deleted: DeleteStatus.No
            }
        })

        if (!(findSection && findSection.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Section"]])
            })
        }

        if (!Object.values(Home_page_sections).includes(section_type)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Section Type"]])
            })
        }

        const isDuplicate = section_type !== Home_page_sections.Banner ? await HomePage.findOne({
            where: {
                id: { [Op.ne]: section_id },
                title: title,
                section_type: section_type,
                is_deleted: DeleteStatus.No
            }
        }) : null;

        if (isDuplicate && isDuplicate.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Section"],
                ]),
            })
        }

        let id_diamond_shape;

        if (id_shape) {
            const diamondShape = await Master.findOne({
                where: {
                    is_active: ActiveStatus.Active,
                    is_deleted: DeleteStatus.No,
                    master_type: Master_type.Stone_shape,
                    id: id_shape
                }
            })

            if (!(diamondShape && diamondShape.dataValues)) {
                return resNotFound({
                    message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond Shape"]])
                })
            }

            id_diamond_shape = diamondShape.dataValues.id
        }

        const trn = await dbContext.transaction();
        try {
            let id_image;
            let id_hover_image;

            if (files["image"]) {
                const imageData = await moveFileToS3ByType(
                    files["image"][0],
                    Image_type.HomePage
                )
                if (imageData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                    return imageData;
                }
                const imageResult = await Image.create(
                    {
                        image_path: imageData.data,
                        created_at: getLocalDate(),
                        created_by: req.body.session_res.id,
                        is_deleted: DeleteStatus.No,
                        is_active: ActiveStatus.Active,
                        image_type: IMAGE_TYPE.HomePage,
                    },
                    { transaction: trn }
                );
                id_image = imageResult.dataValues.id;
            }

            if (files["hover_image"]) {
                const imageData = await moveFileToS3ByType(
                    files["image"][0],
                    Image_type.HomePage
                )
                if (imageData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                    return imageData;
                }
                const imageResult = await Image.create(
                    {
                        image_path: imageData.data,
                        created_at: getLocalDate(),
                        created_by: req.body.session_res.id,
                        is_deleted: DeleteStatus.No,
                        is_active: ActiveStatus.Active,
                        image_type: IMAGE_TYPE.HomePage,
                    },
                    { transaction: trn }
                );
                id_hover_image = imageResult.dataValues.id;
            }

            await HomePage.update(
                {
                    section_type: section_type,
                    title: title,
                    sub_title: sub_title,
                    description: description,
                    button_hover_color: button_hover_color,
                    button_color: button_color,
                    button_text_color: button_text_color,
                    button_name: button_name,
                    button_text_hover_color: button_text_hover_color,
                    is_button_transparent: is_button_transparent,
                    link: link,
                    sort_order: sort_order,
                    hash_tag: hash_tag,
                    id_image: id_image,
                    id_hover_image: id_hover_image,
                    id_diamond_shape,
                    alignment,
                    modified_by: session_res.id,
                    modified_date: getLocalDate(),
                    is_deleted: DeleteStatus.No,
                    is_active: ActiveStatus.Active
                },
                {
                    where: {
                        id: findSection.dataValues.id
                    }, transaction: trn
                }
            );

            await trn.commit();
            return resSuccess({ message: RECORD_UPDATE })
        } catch (error) {
            await trn.rollback();
            throw error
        }

    } catch (error) {
        throw error
    }
}

export const deleteSection = async (req: Request) => {
    try {
        const { section_id } = req.params;
        const { session_res } = req.body;

        const section = await HomePage.findOne({
            where: {
                id: section_id,
                is_deleted: DeleteStatus.No
            }
        })

        if (!(section && section.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Section"]])
            })
        }

        await HomePage.update({
            is_deleted: DeleteStatus.Yes,
            deleted_date: getLocalDate(),
            deleted_by: session_res.id,
        }, {
            where: {
                id: section.dataValues.id,
                is_deleted: DeleteStatus.No
            }
        })

        return resSuccess({ message: RECORD_DELETED })

    } catch (error) {
        throw error
    }
}

export const updateStatus = async (req: Request) => {
    try {
        const { section_id } = req.params;
        const { session_res } = req.body;

        const section = await HomePage.findOne({
            where: {
                id: section_id,
                is_deleted: DeleteStatus.No
            }
        })

        if (!(section && section.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Section"]])
            })
        }

        switch (section.dataValues.is_active) {
            case ActiveStatus.Active:
                await HomePage.update({
                    is_active: ActiveStatus.InActive,
                    modified_by: session_res.id,
                    modified_date: getLocalDate(),
                }, {
                    where: {
                        id: section.dataValues.id,
                        is_deleted: DeleteStatus.No
                    }
                })

                return resSuccess({ message: STATUS_UPDATED })

            case ActiveStatus.InActive:
                await HomePage.update({
                    is_active: ActiveStatus.Active,
                    modified_by: session_res.id,
                    modified_date: getLocalDate(),
                }, {
                    where: {
                        id: section.dataValues.id,
                        is_deleted: DeleteStatus.No
                    }
                })

                return resSuccess({ message: STATUS_UPDATED })

            default:
                break;
        }

    } catch (error) {
        throw error
    }
}

export const getHomePageData = async (req: Request) => {
    try {
        const { query } = req;
        const { section_type } = req.params;
        let paginationProps = {};
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            is_deleted: DeleteStatus.No,
        };
        let noPagination = req.query.no_pagination === "1";

        let where = [
            { is_deleted: DeleteStatus.No },
            pagination.is_active ? { is_active: pagination.is_active } : {},
            { section_type },
        ];

        if (!noPagination) {

            const totalItems = await HomePage.count({
                where,
            });

            if (totalItems === 0) {
                return resSuccess({ data: { pagination, result: [] } });
            }
            pagination.total_items = totalItems;
            pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

            paginationProps = {
                limit: pagination.per_page_rows,
                offset: (pagination.current_page - 1) * pagination.per_page_rows,
            };
        }

        const result = await HomePage.findAll({
            ...paginationProps,
            order: [[pagination.sort_by, pagination.order_by]],
            where,
            attributes: [
                "id",
                "section_type",
                "title",
                "sub_title",
                "description",
                "button_hover_color",
                "button_color",
                "button_text_color",
                "button_text_hover_color",
                "is_button_transparent",
                "link",
                "sort_order",
                "hash_tag",
                "alignment",
                [
                    Sequelize.fn(
                        "CONCAT",
                        IMAGE_URL,
                        Sequelize.literal(`"image"."image_path"`)
                    ),
                    "image_path",
                ],
                [
                    Sequelize.fn(
                        "CONCAT",
                        IMAGE_URL,
                        Sequelize.literal(`"hover_image"."image_path"`)
                    ),
                    "hover_image_path",
                ],
                "id_diamond_shape",
                "is_active",
            ],
            include: [
                {
                    model: Image,
                    as: "image",
                    attributes: [],
                },
                {
                    model: Image,
                    as: "hover_image",
                    attributes: [],
                },
            ],
        });

        return resSuccess({ data: noPagination ? result : { pagination, result } });

    } catch (error) {
        throw error
    }
}

export const getHomePageDataById = async (req: Request) => {
    try {
        const { section_id } = req.params;
        const section = await HomePage.findOne({
            where: {
                id: section_id,
                is_deleted: DeleteStatus.No
            },
            attributes: [
                "id",
                "section_type",
                "title",
                "sub_title",
                "description",
                "button_hover_color",
                "button_color",
                "button_text_color",
                "button_text_hover_color",
                "is_button_transparent",
                "link",
                "sort_order",
                "hash_tag",
                "alignment",
                [
                    Sequelize.fn(
                        "CONCAT",
                        IMAGE_URL,
                        Sequelize.literal(`"image"."image_path"`)
                    ),
                    "image_path",
                ],
                [
                    Sequelize.fn(
                        "CONCAT",
                        IMAGE_URL,
                        Sequelize.literal(`"hover_image"."image_path"`)
                    ),
                    "hover_image_path",
                ],
                "id_diamond_shape",
                "is_active",
            ],
            include: [
                {
                    model: Image,
                    as: "image",
                    attributes: [],
                },
                {
                    model: Image,
                    as: "hover_image",
                    attributes: [],
                },
            ],
        });

        if (!(section && section.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Section"]])
            })
        }
        return resSuccess({ data: section })

    } catch (error) {
        throw error
    }
}
