import { Request } from "express";
import AppUser from "../../model/app_user.model";
import {
  ActiveStatus,
  DeleteStatus,
  IMAGE_TYPE,
  Image_type,
} from "../../utils/app-enumeration";
import {
  getLocalDate,
  prepareMessageFromParams,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ERROR_NOT_FOUND,
  STATUS_UPDATED,
} from "../../utils/app-messages";
import Company from "../../model/company.modal";
import Image from "../../model/image.model";
import { Sequelize } from "sequelize";
import dbContext from "../../config/dbContext";
import { moveFileToS3ByType } from "../../helpers/file-helper";
import { IMAGE_URL } from "../../config/env.var";

export const getUserDetail = async (req: Request) => {
  try {
    const { session_res } = req.body;
    const user = await AppUser.findOne({
      where: {
        id: session_res.user_id,
        is_deleted: DeleteStatus.No,
        is_active: ActiveStatus.Active,
      },
    });

    if (!(user && user.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "User"],
        ]),
      });
    }
    const companyDetail = await Company.findOne({
      where: {
        user_id: user.dataValues.id,
        is_deleted: DeleteStatus.No,
      },
      attributes: [
        "id",
        "user_id",
        "company_name",
        "company_website",
        "company_email",
        "abn_number",
        "address",
        "city",
        "state",
        "country",
        "postcode",
      ],
      include: [
        {
          model: AppUser,
          as: "user",
          attributes: [
            "id",
            "first_name",
            "last_name",
            "email",
            "user_type",
            "phone_number",
            "is_verified",
            "id_image",
            [
              Sequelize.fn(
                "CONCAT",
                IMAGE_URL,
                Sequelize.literal(`"user->image"."image_path"`)
              ),
              "image_path",
            ],
          ],
          include: [
            {
              model: Image,
              as: "image",
              attributes: [],
            },
          ],
        },
      ],
    });

    return resSuccess({ data: companyDetail });
  } catch (error) {
    throw error;
  }
};

export const updateUserDetail = async (req: Request) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      company_name,
      company_website,
      abn_number,
      address,
      city,
      country,
      state,
      postcode,
      session_res,
    } = req.body;

    const { file } = req;
    let filePath = null;

    if (req.file) {
      const moveFileResult = await moveFileToS3ByType(
        req.file,
        Image_type.User
      );

      if (moveFileResult.code !== DEFAULT_STATUS_CODE_SUCCESS) {
        return moveFileResult;
      }

      filePath = moveFileResult.data;
    }

    const user = await AppUser.findOne({
      where: {
        id: session_res.user_id,
        is_deleted: DeleteStatus.No,
        is_active: ActiveStatus.Active,
      },
    });

    let id_image;

    if (!(user && user.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "User"],
        ]),
      });
    }

    const trn = await dbContext.transaction();

    try {
      if (user.dataValues.id_image) {
        if (file?.path) {
          await Image.update(
            {
              image_path: filePath,
              modified_at: getLocalDate(),
              modified_by: session_res.user_id,
              image_type: IMAGE_TYPE.User,
            },
            {
              where: { id: user.dataValues.id_image },
              transaction: trn,
            }
          );
        }
      } else {
        if (file?.path) {
          const imageData = await Image.create(
            {
              image_path: file.path,
              created_at: getLocalDate(),
              created_by: session_res.user_id,
              is_deleted: DeleteStatus.No,
              image_type: IMAGE_TYPE.User,
            },
            {
              transaction: trn,
            }
          );

          id_image = imageData.dataValues.id;
        }
      }

      await AppUser.update(
        {
          first_name: first_name,
          last_name: last_name,
          phone_number: phone_number,
          modified_at: getLocalDate(),
          modified_by: session_res.user_id,
          id_image: user.dataValues.id_image
            ? user.dataValues.id_image
            : id_image,
        },
        {
          where: {
            id: user.dataValues.id,
            is_deleted: DeleteStatus.No,
            is_active: ActiveStatus.Active,
          },
          transaction: trn,
        }
      );

      await Company.update(
        {
          company_name: company_name,
          company_website: company_website,
          abn_number: abn_number,
          address: address,
          city: city,
          country: country,
          state: state,
          postcode: postcode,
          modified_at: getLocalDate(),
          modified_by: session_res.user_id,
        },
        {
          where: {
            user_id: user.dataValues.id,
            is_deleted: DeleteStatus.No,
          },
          transaction: trn,
        }
      );

      trn.commit();
      return resSuccess({ message: STATUS_UPDATED });
    } catch (error) {
      trn.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};
