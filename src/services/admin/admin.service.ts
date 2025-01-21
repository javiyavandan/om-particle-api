import AppUser from "../../model/app_user.model";
import { Request } from "express";
import {
  getInitialPaginationFromQuery,
  getLocalDate,
  prepareMessageFromParams,
  refreshMaterializedDiamondListView,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import { Op, Sequelize } from "sequelize";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ERROR_NOT_FOUND,
  RECORD_UPDATE,
  STATUS_UPDATED,
  UPDATE,
  USER_NOT_FOUND,
  USER_NOT_VERIFIED,
  VERIFIED,
} from "../../utils/app-messages";
import {
  ActiveStatus,
  DeleteStatus,
  UserType,
  UserVerification,
  UserListType,
  File_type,
  FILE_TYPE,
  Image_type,
  IMAGE_TYPE,
} from "../../utils/app-enumeration";
import Image from "../../model/image.model";
import { IMAGE_URL } from "../../config/env.var";
import { mailUserVerified } from "../mail.service";
import ContactUs from "../../model/contact-us.model";
import Customer from "../../model/customer.modal";
import File from "../../model/files.model";
import dbContext from "../../config/dbContext";
import { moveFileToS3ByType } from "../../helpers/file-helper";

export const userList = async (req: Request) => {
  try {
    const { query } = req;
    let paginationProps = {};
    let pagination = {
      ...getInitialPaginationFromQuery(query),
      search_text: query.search_text,
    };
    let noPagination = req.query.no_pagination === "1";

    const status =
      query.status === UserListType.Approved
        ? UserVerification.Admin_Verified
        : [UserVerification.User_Verified, UserVerification.NotVerified];

    let where = [
      { user_type: UserType.Customer },
      { is_deleted: DeleteStatus.No },
      { is_verified: status },
      pagination.is_active ? { is_active: pagination.is_active } : {},
      pagination.search_text
        ? {
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${pagination.search_text}%` } },
            { last_name: { [Op.iLike]: `%${pagination.search_text}%` } },
            { email: { [Op.iLike]: `%${pagination.search_text}%` } },
            { phone_number: { [Op.iLike]: `%${pagination.search_text}%` } },
            { '$customer.company_name$': { [Op.iLike]: `%${pagination.search_text}%` } },
            { '$customer.country$': { [Op.iLike]: `%${pagination.search_text}%` } },
            { '$customer.state$': { [Op.iLike]: `%${pagination.search_text}%` } },
          ],
        }
        : {},
    ];

    const totalItems = await AppUser.count({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: []
        }
      ],
    });

    if (!noPagination) {
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

    const user = await AppUser.findAll({
      where,
      ...paginationProps,
      order: [[pagination.sort_by, pagination.order_by]],
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone_number",
        "is_verified",
        "is_active",
        [Sequelize.literal(`customer.company_name`), "company_name"],
        [Sequelize.literal(`customer.country`), "country"],
        [Sequelize.literal(`customer.state`), "state"],
      ],
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: []
        }
      ],
    });
    return resSuccess({ data: { pagination, result: user } });
  } catch (e) {
    throw e;
  }
};

export const userDetail = async (req: Request) => {
  try {
    const params = req.params;
    const user = await AppUser.findOne({
      where: {
        id: params.id,
        is_deleted: DeleteStatus.No,
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
        user_id: params.id,
        is_deleted: DeleteStatus.No,
      },
      attributes: [
        "id",
        "user_id",
        "company_name",
        "company_website",
        "company_email",
        "registration_number",
        "address",
        "city",
        "state",
        "country",
        "postcode",
        [Sequelize.literal(`(SELECT COUNT(*) FROM memo_list WHERE memo_list.customer_id = customers.id)`), "total_memo"],
        [Sequelize.literal(`(SELECT COUNT(*) FROM invoice_list WHERE invoice_list.customer_id = customers.id)`), "total_invoice"],
        [Sequelize.literal(`(SELECT SUM(invoice_list.total_price) FROM invoice_list WHERE invoice_list.customer_id = customers.id)`), "total_invoice_price"],
        [Sequelize.literal(`(SELECT SUM(invoice_list.total_item_price) FROM invoice_list WHERE invoice_list.customer_id = customers.id)`), "total_memo_price"],
        [Sequelize.literal(`(SELECT SUM(invoice_list.total_weight) FROM invoice_list WHERE invoice_list.customer_id = customers.id)`), "total_invoice_weight"],
        [Sequelize.literal(`(SELECT SUM(memo_list.total_weight) FROM memo_list WHERE memo_list.customer_id = customers.id)`), "total_memo_weight"],
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
            "is_active",
            "remarks",
            // Corrected file_path and image_path
            [
              Sequelize.literal(`CASE WHEN "user->file"."file_path" IS NOT NULL THEN CONCAT('${IMAGE_URL}', "user->file"."file_path") ELSE NULL END`),
              "file_path",
            ],
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
            {
              model: File,
              as: "file",
              attributes: [],
            },
          ],
        },
      ],
    });

    return resSuccess({ data: companyDetail });
  } catch (e) {
    throw e;
  }
};

export const userVerify = async (req: Request) => {
  try {
    const { user_id } = req.params;
    const { status } = req.body;
    const { user_id: admin_id } = req.body.session_res;
    const user = await AppUser.findOne({
      where: {
        id: user_id,
        is_deleted: DeleteStatus.No,
      },
    });

    if (!(user && user.dataValues)) {
      return resNotFound({ message: USER_NOT_FOUND });
    } else {
      await AppUser.update(
        {
          is_verified: status,
          modified_at: getLocalDate(),
          modified_by: admin_id,
        },
        {
          where: {
            id: user.dataValues.id,
          },
        }
      );
      const mailPayload = {
        toEmailAddress: user?.dataValues.email,
        contentTobeReplaced: {
          name: `${user.dataValues.first_name} ${user.dataValues.last_name}`,
          email: user.dataValues.email,
        },
      };
      if (status === UserVerification.Admin_Verified) {
        await mailUserVerified(mailPayload);
      }
      await refreshMaterializedDiamondListView();
      return resSuccess({
        message:
          status === UserVerification.User_Verified
            ? USER_NOT_VERIFIED.replace("please contact admin!", "")
            : prepareMessageFromParams(VERIFIED, [["field_name", "User"]]),
      });
    }
  } catch (e) {
    throw e;
  }
};

export const updateUserStatus = async (req: Request) => {
  try {
    const { user_id } = req.params;

    const user = await AppUser.findOne({
      where: {
        id: user_id,
        is_deleted: DeleteStatus.No,
      },
    });

    if (!(user && user.dataValues)) {
      return resNotFound({ message: USER_NOT_FOUND });
    }

    await AppUser.update(
      {
        is_active:
          user.dataValues.is_active === ActiveStatus.Active
            ? ActiveStatus.InActive
            : ActiveStatus.Active,
        modified_at: getLocalDate(),
        modified_by: req.body.session_res.id,
      },
      { where: { id: user.dataValues.id } }
    );

    await refreshMaterializedDiamondListView();
    return resSuccess({
      message: prepareMessageFromParams(UPDATE, [
        ["field_name", "User Status"],
      ]),
    });
  } catch (error) {
    throw error;
  }
};

export const contactUsList = async (req: Request) => {
  try {
    const { query } = req;
    let pagination = {
      ...getInitialPaginationFromQuery(query),
      search_text: query.search_text,
    };

    let where = [
      pagination.is_active ? { is_active: pagination.is_active } : {},
      pagination.search_text
        ? {
          [Op.or]: {
            name: { [Op.iLike]: `%${pagination.search_text}%` },
            email: { [Op.iLike]: `%${pagination.search_text}%` },
            phone_number: { [Op.iLike]: `%${pagination.search_text}%` },
          },
        }
        : {},
    ];

    const totalItems = await ContactUs.count({
      where,
    });

    if (totalItems === 0) {
      return resSuccess({ data: { pagination, result: [] } });
    }

    pagination.total_items = totalItems;

    const result = await ContactUs.findAll({
      where,
      limit: pagination.per_page_rows,
      offset: (pagination.current_page - 1) * pagination.per_page_rows,
      order: [[pagination.sort_by, pagination.order_by]],
      attributes: [
        "id",
        "name",
        "email",
        "phone_number",
        "message",
        "created_at",
      ],
    });

    return resSuccess({ data: { pagination, result } });
  } catch (error) {
    throw error;
  }
};

export const updateUserDetail = async (req: Request) => {
  try {
    const {
      first_name,
      last_name,
      company_name,
      company_website,
      registration_number,
      address,
      city,
      country,
      state,
      postcode,
      remarks,
      session_res
    } = req.body;
    const { user_id } = req.params;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const user = await AppUser.findOne({
      where: {
        id: user_id,
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
        const fileData = await moveFileToS3ByType(
          files["pdf"][0],
          File_type.Customer
        )

        if (fileData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
          return fileData;
        }
        const fileResult = await File.create(
          {
            file_path: fileData.data,
            created_at: getLocalDate(),
            created_by: req.body.session_res.id,
            is_deleted: DeleteStatus.No,
            is_active: ActiveStatus.Active,
            file_type: FILE_TYPE.Customer,
          },
          { transaction: trn }
        );
        pdfId = fileResult.dataValues.id;
      } else {
        pdfId = user.dataValues.id_pdf;
      }

      await AppUser.update(
        {
          first_name: first_name,
          last_name: last_name,
          remarks,
          modified_at: getLocalDate(),
          modified_by: session_res.id,
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
          registration_number: registration_number,
          address: address,
          city: city,
          country: country,
          state: state,
          postcode: postcode,
          modified_at: getLocalDate(),
          modified_by: session_res.id,
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
      return resSuccess({ message: RECORD_UPDATE });
    } catch (error) {
      await trn.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

