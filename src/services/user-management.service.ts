import { Request } from "express";
import { Op, Sequelize, Transaction } from "sequelize";
import BusinessUser from "../model/business-user.model";
import {
  columnValueLowerCase,
  getInitialPaginationFromQuery,
  getLocalDate,
  prepareMessageFromParams,
  resBadRequest,
  resNotFound,
  resSuccess,
} from "../utils/shared-functions";
import bcrypt from "bcrypt";
import { PASSWORD_SOLT } from "../utils/app-constants";
import { ActiveStatus, DeleteStatus, Image_type, IMAGE_TYPE, UserType } from "../utils/app-enumeration";
import Role from "../model/role.model";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  EMAIL_ALL_READY_EXIST,
  ERROR_NOT_FOUND,
  INVALID_ID,
  ROLE_NOT_FOUND,
  USER_NOT_FOUND,
} from "../utils/app-messages";
import Image from "../model/image.model";
import AppUser from "../model/app_user.model";
import dbContext from "../config/dbContext";
import { moveFileToS3ByType } from "../helpers/file-helper";
import { IMAGE_URL } from "../config/env.var";
import Company from "../model/companys.model";

const checkBURoleAndEmailAvailability = async (
  idRole: number,
  email: string | null = null,
  trn: Transaction | null = null,
  ignoredId: number | null = null
) => {
  const findRole = await Role.findOne({
    where: { id: idRole, is_deleted: "0", is_active: "1" },
    ...(trn ? { transaction: trn } : {}),
  });

  if (!(findRole && findRole.dataValues)) {
    return resNotFound({ message: ROLE_NOT_FOUND });
  }

  if (email) {
    const findUserWithEmail = await AppUser.findOne({
      where: [
        columnValueLowerCase("email", email),
        { is_deleted: "0" },
        ignoredId ? { id: { [Op.ne]: ignoredId } } : {},
      ],
      ...(trn ? { transaction: trn } : {}),
    });

    if (findUserWithEmail && findUserWithEmail.dataValues) {
      return resNotFound({ message: EMAIL_ALL_READY_EXIST });
    }
  }
  return resSuccess();
};

export const getAllBusinessUsers = async (req: Request) => {
  try {
    let pagination = {
      ...getInitialPaginationFromQuery(req.query),
      search_text: req.query.search_text,
    };

    let where = [
      { is_deleted: "0" },
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

    const totalItems = await BusinessUser.count({
      where,
    });

    if (totalItems === 0) {
      return resSuccess({ data: { pagination, result: [] } });
    }
    pagination.total_items = totalItems;
    pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

    const result = await BusinessUser.findAll({
      where,
      limit: pagination.per_page_rows,
      offset: (pagination.current_page - 1) * pagination.per_page_rows,
      order: [[pagination.sort_by, pagination.order_by]],
      include: [
        {
          model: AppUser, as: "app_user", attributes: [], include: [{
            model: Company,
            as: "company",
            attributes: [],
          }]
        },
        { model: Image, as: "image", attributes: [] },
      ],
      attributes: [
        "id",
        "name",
        "email",
        "phone_number",
        "is_active",
        [Sequelize.literal("app_user.id_role"), "id_role"],
        [Sequelize.literal("app_user.id"), "user_id"],
        [Sequelize.literal(`"app_user->company"."id"`), "company_id"],
        [Sequelize.literal(`"app_user->company"."name"`), "company_name"],
        [
          Sequelize.literal(`
            CASE WHEN image.image_path IS NOT NULL THEN CONCAT('${IMAGE_URL}', image.image_path) ELSE NULL END
          `),
          "image_path",
        ]        
      ],
    });
    return resSuccess({ data: { pagination, result } });
  } catch (e) {
    throw e;
  }
};

export const getBusinessUserById = async (req: Request) => {
  try {
    let idBusinessUser: any = req.params.id;
    if (!idBusinessUser) return resBadRequest({ message: INVALID_ID });
    idBusinessUser = parseInt(idBusinessUser);

    const result = await BusinessUser.findOne({
      where: { id: idBusinessUser, is_deleted: "0" },
      include: {
        model: AppUser, as: "app_user", attributes: [], include: [{
          model: Company,
          as: "company",
          attributes: [],
        }]
      },
      attributes: [
        "id",
        "name",
        "email",
        "phone_number",
        "is_active",
        [Sequelize.literal("app_user.id_role"), "id_role"],
        [Sequelize.literal(`"app_user->company"."id"`), "company_id"],
        [Sequelize.literal(`"app_user->company"."name"`), "company_name"],
      ],
    });

    if (result) {
      return resSuccess({ data: result });
    }

    return resNotFound({ message: USER_NOT_FOUND });
  } catch (e) {
    throw e;
  }
};

export const addBusinessUser = async (req: Request) => {
  const trn = await dbContext.transaction();
  try {
    const { email, password, name, phone_number, id_role, company_id } =
      req.body;
    let idImage = null;

    const findCompany = await Company.findOne({
      where: { id: company_id, is_deleted: DeleteStatus.No },
    })

    if (!(findCompany && findCompany.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Company"]]),
      })
    }

    const roleEmailChecker = await checkBURoleAndEmailAvailability(
      id_role,
      email,
      trn
    );

    if (roleEmailChecker.code !== DEFAULT_STATUS_CODE_SUCCESS) {
      await trn.rollback();
      return roleEmailChecker;
    }

    const pass_hash = await bcrypt.hash(password, Number(PASSWORD_SOLT));

    if (req.file) {
      const moveFileResult = await moveFileToS3ByType(
        req.file,
        Image_type.User
      );

      if (moveFileResult.code !== DEFAULT_STATUS_CODE_SUCCESS) {
        await trn.rollback();
        return moveFileResult;
      }

      const imageResult = await Image.create(
        {
          image_path: moveFileResult.data,
          image_type: IMAGE_TYPE.Profile,
          created_by: req.body.session_res.id_app_user,
          created_at: getLocalDate(),
        },
        { transaction: trn }
      );

      idImage = imageResult.dataValues.id;
    }

    const resultAU = await AppUser.create(
      {
        email: email,
        first_name: name,
        password: pass_hash,
        id_role,
        phone_number,
        id_image: idImage,
        user_type: UserType.Admin,
        is_active: ActiveStatus.Active,
        company_id: findCompany.dataValues.id,
        created_by: req.body.session_res.id_app_user,
        created_at: getLocalDate(),
      },
      { transaction: trn }
    );

    await BusinessUser.create(
      {
        id_app_user: resultAU.dataValues.id,
        name,
        email,
        phone_number,
        is_active: ActiveStatus.Active,
        id_image: idImage,
        created_by: req.body.session_res.id_app_user,
        created_date: getLocalDate(),
      },
      { transaction: trn }
    );

    await trn.commit();
    return resSuccess();
  } catch (e) {
    await trn.rollback();
    throw e;
  }
};

export const updateBusinessUser = async (req: Request) => {
  const trn = await dbContext.transaction();
  try {
    const { name, phone_number, id_role, company_id } = req.body;
    let idImage = null;

    const findCompany = await Company.findOne({
      where: { id: company_id, is_deleted: DeleteStatus.No },
    })

    if (!(findCompany && findCompany.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Company"]]),
      })
    }

    let idBusinessUser: any = req.params.id;
    if (!idBusinessUser) return resBadRequest({ message: INVALID_ID });
    idBusinessUser = parseInt(idBusinessUser);

    const buToUpdate = await BusinessUser.findOne({
      where: { id: idBusinessUser, is_deleted: "0" },
      transaction: trn,
    });

    if (!(buToUpdate && buToUpdate.dataValues)) {
      await trn.rollback();
      return resNotFound({ message: USER_NOT_FOUND });
    }

    if (req.body.only_active_inactive === "1") {
      await AppUser.update(
        {
          is_active: ActiveStatus.Active,
          modified_by: req.body.session_res.id_app_user,
          modified_date: getLocalDate(),
        },
        { where: { id: buToUpdate.dataValues.id_app_user }, transaction: trn }
      );

      await BusinessUser.update(
        {
          is_active: ActiveStatus.Active,
          modified_by: req.body.session_res.id_app_user,
          modified_date: getLocalDate(),
        },
        { where: { id: buToUpdate.dataValues.id }, transaction: trn }
      );

      await trn.commit();
      return resSuccess();
    }

    if (buToUpdate.dataValues.id_role !== id_role) {
      const roleEmailChecker = await checkBURoleAndEmailAvailability(
        id_role,
        null,
        trn
      );

      if (roleEmailChecker.code !== DEFAULT_STATUS_CODE_SUCCESS) {
        await trn.rollback();
        return roleEmailChecker;
      }
    }

    if (req.file) {
      const moveFileResult = await moveFileToS3ByType(
        req.file,
        Image_type.User
      );

      if (moveFileResult.code !== DEFAULT_STATUS_CODE_SUCCESS) {
        await trn.rollback();
        return moveFileResult;
      }

      if (buToUpdate.dataValues.id_image) {
        idImage = buToUpdate.dataValues.id_image;
        await Image.update(
          {
            image_path: moveFileResult.data,
            image_type: IMAGE_TYPE.Profile,
            modified_by: req.body.session_res.id_app_user,
            modified_at: getLocalDate(),
          },
          { where: { id: buToUpdate.dataValues.id_image }, transaction: trn }
        );
      } else {
        const imageResult = await Image.create(
          {
            image_path: moveFileResult.data,
            image_type: IMAGE_TYPE.Profile,
            created_by: req.body.session_res.id_app_user,
            created_at: getLocalDate(),
          },
          { transaction: trn }
        );

        idImage = imageResult.dataValues.id;
      }
    } else {
      idImage = buToUpdate.dataValues.id_image;
    }

    await AppUser.update(
      {
        is_active: ActiveStatus.Active,
        id_role,
        id_image: idImage,
        company_id: findCompany.dataValues.id,
        modified_by: req.body.session_res.id_app_user,
        modified_date: getLocalDate(),
      },
      { where: { id: buToUpdate.dataValues.id_app_user }, transaction: trn }
    );

    await BusinessUser.update(
      {
        name,
        phone_number,
        is_active: ActiveStatus.Active,
        id_image: idImage,
        modified_by: req.body.session_res.id_app_user,
        modified_date: getLocalDate(),
      },
      { where: { id: buToUpdate.dataValues.id }, transaction: trn }
    );

    await trn.commit();
    return resSuccess();
  } catch (e) {
    await trn.rollback();
    throw e;
  }
};

export const deleteBusinessUser = async (req: Request) => {
  const trn = await dbContext.transaction();
  try {
    let idBusinessUser: any = req.params.id;
    if (!idBusinessUser) return resBadRequest({ message: INVALID_ID });
    idBusinessUser = parseInt(idBusinessUser);

    const buToDelete = await BusinessUser.findOne({
      where: { id: idBusinessUser, is_deleted: "0" },
    });

    if (!(buToDelete && buToDelete.dataValues)) {
      await trn.rollback();
      return resNotFound({ message: USER_NOT_FOUND });
    }

    await AppUser.update(
      {
        is_deleted: "1",
        modified_by: req.body.session_res.id_app_user,
        modified_date: getLocalDate(),
      },
      { where: { id: buToDelete.dataValues.id_app_user }, transaction: trn }
    );

    await BusinessUser.update(
      {
        is_deleted: "1",
        modified_by: req.body.session_res.id_app_user,
        modified_date: getLocalDate(),
      },
      { where: { id: buToDelete.dataValues.id }, transaction: trn }
    );

    await trn.commit();
    return resSuccess();
  } catch (e) {
    await trn.rollback();
    throw e;
  }
};
