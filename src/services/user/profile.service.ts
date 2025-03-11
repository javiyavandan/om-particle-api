import { Request } from "express";
import AppUser from "../../model/app_user.model";
import {
  ActiveStatus,
  DeleteStatus,
  FILE_TYPE,
  File_type,
  IMAGE_TYPE,
  Image_type,
} from "../../utils/app-enumeration";
import {
  getLocalDate,
  prepareMessageFromParams,
  refreshMaterializedDiamondListView,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ERROR_NOT_FOUND,
  STATUS_UPDATED,
} from "../../utils/app-messages";
import Customer from "../../model/customer.modal";
import Image from "../../model/image.model";
import { Sequelize } from "sequelize";
import dbContext from "../../config/dbContext";
import { moveFileToS3ByType } from "../../helpers/file-helper";
import { IMAGE_URL } from "../../config/env.var";
import File from "../../model/files.model";

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
    const companyDetail = await Customer.findOne({
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
        "address",
        "city",
        "state",
        "country",
        "postcode",
        "registration_number",
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
            "remarks",
            "id_pdf",
            [
              Sequelize.literal(`CASE WHEN "user->image"."image_path" IS NOT NULL THEN CONCAT('${IMAGE_URL}', "user->image"."image_path") ELSE NULL END`),
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

    if (companyDetail?.dataValues.user.id_pdf) {
      const files = await File.findAll({
        where: {
          file_type: FILE_TYPE.Customer,
          is_deleted: DeleteStatus.No,
        },
        attributes: ["id", "file_path"],
      })
      let pdf: any = [];
      companyDetail.dataValues.user.id_pdf.map((value: number) => {
        pdf.push({
          id: value,
          file_path: IMAGE_URL + files.find((file) => file.dataValues.id === value)?.dataValues.file_path
        })
      })
      companyDetail.dataValues.user.id_pdf = pdf;
    }


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
      address,
      city,
      country,
      state,
      postcode,
      remarks,
      session_res,
      registration_number,
      id_pdf
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

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

    const trn = await dbContext.transaction();

    try {
      let imageId;
      if (files["image"]) {
        const imageData = await moveFileToS3ByType(
          files["image"][0],
          Image_type.User
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
            image_type: IMAGE_TYPE.User,
          },
          { transaction: trn }
        );
        imageId = imageResult.dataValues.id;
      } else {
        imageId = user.dataValues.id_image;
      }

      let pdfId;
      if (files["pdf"]) {
        const pdf: any = [];
        for (let index = 0; index < files["pdf"].length; index++) {
          const file: Express.Multer.File = files["pdf"][index];
          const fileData = await moveFileToS3ByType(
            file,
            File_type.Customer
          )
          if (fileData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return fileData;
          }

          pdf.push({
            file_path: fileData.data,
            created_at: getLocalDate(),
            created_by: req.body.session_res.id,
            is_deleted: DeleteStatus.No,
            is_active: ActiveStatus.Active,
            file_type: FILE_TYPE.Customer,
          })
        }

        const fileResult = await File.bulkCreate(
          pdf,
          { transaction: trn }
        );

        if (id_pdf) {
          pdfId = (typeof id_pdf === "string" ? [id_pdf] : id_pdf.map((item: any) => item)).concat(fileResult.map((item) => item.dataValues.id));
        } else {
          pdfId = fileResult.map((item) => item.dataValues.id);
        }
      } else {
        pdfId = (typeof id_pdf === "string" ? [id_pdf] : id_pdf)?.map((item: any) => item);
      }

      await AppUser.update(
        {
          first_name: first_name,
          last_name: last_name,
          phone_number: phone_number,
          remarks,
          modified_at: getLocalDate(),
          modified_by: session_res.user_id,
          id_image: imageId,
          id_pdf: pdfId,
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

      await Customer.update(
        {
          company_name: company_name,
          company_website: company_website,
          address: address,
          city: city,
          country: country,
          state: state,
          postcode: postcode,
          registration_number,
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

      await trn.commit();
      await refreshMaterializedDiamondListView();
      return resSuccess({ message: STATUS_UPDATED });
    } catch (error) {
      await trn.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};
