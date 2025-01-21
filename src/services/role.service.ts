import { Request } from "express";
import { Model, Op, Sequelize, Transaction } from "sequelize";
import { IRolePermissionAccess } from "../data/interfaces/common/common.interface";
import Action from "../model/action.model";
import MenuItem from "../model/menu-items.model";
import RolePermissionAccess from "../model/role-permission-access.model";
import RolePermissionAccessAuditLog from "../model/role-permission-access-audit-log.model";
import RolePermission from "../model/role-permission.model";
import Role from "../model/role.model";
import {
  ACCESS_NOT_FOUND,
  DEFAULT_STATUS_CODE_SUCCESS,
  ERROR_NOT_FOUND,
  MENU_ITEM_NOT_FOUND,
  ROLE_NOT_FOUND,
  ROLE_WITH_SAME_NAME_AVAILABLE,
  USER_WITH_ROLE_AVAILABLE,
} from "../utils/app-messages";
import {
  getInitialPaginationFromQuery,
  getLocalDate,
  prepareMessageFromParams,
  resNotFound,
  resSuccess,
  resUnauthorizedAccess,
  resUnprocessableEntity,
} from "../utils/shared-functions";
import { ActiveStatus, DeleteStatus, UserType } from "../utils/app-enumeration";

import Image from "../model/image.model";
import AppUser from "../model/app_user.model";
import BusinessUser from "../model/business-user.model";
import dbContext from "../config/dbContext";
import RoleApiPermission from "../model/role-api-permission.model";
import Company from "../model/companys.model";

export const getAllRoles = async (req: Request) => {
  try {
    let paginationProps = {};
    let pagination = getInitialPaginationFromQuery(req.query);

    let where = [
      { is_deleted: "0", id: { [Op.ne]: 0 } },
      pagination.is_active ? { is_active: pagination.is_active } : {},
    ];

    let noPagination = req.query.no_pagination === "1";
    if (!noPagination) {
      const totalItems = await Role.count({
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

    const result = await Role.findAll({
      ...paginationProps,
      where,
      order: [[pagination.sort_by, pagination.order_by]],
      attributes: [
        "id",
        "role_name",
        "is_active",
        [
          Sequelize.literal(
            `(SELECT COUNT(*) FROM app_users WHERE app_users.id_role=roles.id AND app_users.is_deleted='0')`
          ),
          "user_count",
        ],
        [Sequelize.literal(`company_master.name`), 'companyName'],
        [Sequelize.literal(`company_master.id`), 'companyId']
      ],
      include: [
        {
          model: AppUser,
          as: "app_user",
          attributes: [
            "id",
            [
              Sequelize.literal(`"app_user->business_users->image"."image_path"`),
              "image_path",
            ],
          ],
          include: [
            {
              model: BusinessUser,
              as: "business_users",
              attributes: [],
              include: [
                {
                  model: Image,
                  as: "image",
                  attributes: [],
                },
              ],
            },
          ],
        },
        {
          model: Company,
          as: "company_master",
          attributes: [],
        }
      ],
    });
    return resSuccess({ data: noPagination ? result : { pagination, result } });
  } catch (e) {
    throw e;
  }
};

const roleWithSameNameValidation = async (
  role_name: string,
  id: number | null = null
) => {
  const findRoleWithSameName = await Role.findOne({
    where: [
      { role_name: { [Op.iLike]: role_name }, is_deleted: "0" },
      id ? { id: { [Op.ne]: id } } : {},
    ],
  });

  if (findRoleWithSameName && findRoleWithSameName.dataValues) {
    return resUnprocessableEntity({
      message: prepareMessageFromParams(ROLE_WITH_SAME_NAME_AVAILABLE, [
        ["action", id ? "updated" : "added"],
      ]),
    });
  }

  return resSuccess();
};

export const addRole = async (req: Request) => {
  try {
    const nameValidaton = await roleWithSameNameValidation(req.body.role_name);
    if (nameValidaton.code !== DEFAULT_STATUS_CODE_SUCCESS) {
      return nameValidaton;
    }

    const findCompany = await Company.findOne({
      where: { id: req.body.company_id, is_deleted: DeleteStatus.No },
    })

    if (!(findCompany && findCompany.dataValues)) {
      return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Company"]]) });
    }

    await Role.create({
      role_name: req.body.role_name,
      company_id: req.body.company_id,
      is_active: ActiveStatus.Active,
      created_by: req.body.session_res.id,
      created_date: getLocalDate(),
    });

    return resSuccess();
  } catch (e) {
    throw e;
  }
};

export const updateRole = async (req: Request) => {
  try {
    const idRole = parseInt(req.params.id);
    const roleToUpdate = await Role.findOne({
      where: { id: idRole, is_deleted: "0" },
    });

    if (!(roleToUpdate && roleToUpdate.dataValues)) {
      return resNotFound({ message: ROLE_NOT_FOUND });
    }

    if (req.body.only_active_inactive === "1") {
      await Role.update(
        {
          is_active: ActiveStatus.Active,
          modified_by: req.body.session_res.id,
          modified_date: getLocalDate(),
        },
        { where: { id: roleToUpdate.dataValues.id } }
      );

      return resSuccess();
    }

    const nameValidaton = await roleWithSameNameValidation(
      req.body.role_name,
      idRole
    );
    if (nameValidaton.code !== DEFAULT_STATUS_CODE_SUCCESS) {
      return nameValidaton;
    }

    const findCompany = await Company.findOne({
      where: { id: req.body.company_id, is_deleted: DeleteStatus.No },
    })

    if (!(findCompany && findCompany.dataValues)) {
      return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Company"]]) });
    }

    await Role.update(
      {
        role_name: req.body.role_name,
        company_id: req.body.company_id,
        is_active: ActiveStatus.Active,
        modified_by: req.body.session_res.id,
        modified_date: getLocalDate(),
      },
      { where: { id: roleToUpdate.dataValues.id } }
    );

    return resSuccess();
  } catch (e) {
    throw e;
  }
};

export const deleteRole = async (req: Request) => {
  try {
    const idRole = parseInt(req.params.id);

    if (idRole === 0) {
      return resUnauthorizedAccess();
    }

    const roleToDelete = await Role.findOne({
      where: { id: idRole, is_deleted: "0" },
      attributes: [
        "id",
        [
          Sequelize.literal(
            `(SELECT COUNT(*) FROM app_users WHERE app_users.id_role = roles.id AND app_users.is_deleted = '0')`
          ),
          "user_count",
        ],
        [Sequelize.literal(`company_master.name`), 'companyName'],
        [Sequelize.literal(`company_master.id`), 'companyId']
      ],
      include: [
        {
          model: Company,
          as: "company_master",
          attributes: [],
        }
      ]
    });

    if (!(roleToDelete && roleToDelete.dataValues)) {
      return resNotFound({ message: ROLE_NOT_FOUND });
    }

    if (parseInt(roleToDelete.dataValues.user_count) !== 0) {
      return resUnprocessableEntity({ message: USER_WITH_ROLE_AVAILABLE });
    }

    await Role.update(
      {
        is_deleted: "1",
        modified_by: req.body.session_res.id,
        modified_date: getLocalDate(),
      },
      { where: { id: roleToDelete.dataValues.id } }
    );

    return resSuccess();
  } catch (e) {
    throw e;
  }
};

export const getAllActions = async (req: Request) => {
  try {
    let paginationProps = {};
    let pagination = getInitialPaginationFromQuery(req.query);
    let where = [
      { is_deleted: "0" },
      pagination.is_active ? { is_active: pagination.is_active } : {},
    ];

    let noPagination = req.query.no_pagination === "1";
    if (!noPagination) {
      const totalItems = await Action.count({
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

    const result = await Action.findAll({
      ...paginationProps,
      order: [[pagination.sort_by, pagination.order_by]],
      where,
      attributes: ["id", "action_name", "is_active"],
    });
    return resSuccess({ data: noPagination ? result : { pagination, result } });
  } catch (e) {
    throw e;
  }
};

export const addAction = async (req: Request) => {
  try {
    const { name} = req.body

    await Action.create({
      action_name: name,
      is_active: ActiveStatus.Active,
      is_deleted: DeleteStatus.No,
      created_by: req.body.session_res.id,
      created_date: getLocalDate(),
    })
    return resSuccess()
  } catch (error) {
    throw error
  }
}

export const getAllMenuItems = async (req: Request) => {
  try {
    let paginationProps = {};
    let pagination = getInitialPaginationFromQuery(req.query);
    let where = [
      { is_deleted: "0" },
      pagination.is_active ? { is_active: pagination.is_active } : {},
    ];

    let noPagination = req.query.no_pagination === "1";
    if (!noPagination) {
      const totalItems = await MenuItem.count({
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

    const result = await MenuItem.findAll({
      ...paginationProps,
      order: [[pagination.sort_by, pagination.order_by]],
      where,
      attributes: [
        "id",
        "name",
        "id_parent_menu",
        "nav_path",
        "menu_location",
        "sort_order",
        "is_active",
      ],
    });
    return resSuccess({ data: noPagination ? result : { pagination, result } });
  } catch (e) {
    throw e;
  }
};

export const fetchRoleConfiguration = async (req: Request) => {
  try {
    const idRole = parseInt(req.params.id);

    const roleToFetch = await Role.findOne({
      where: { id: idRole, is_deleted: "0" },
    });

    if (!(roleToFetch && roleToFetch.dataValues)) {
      return resNotFound({ message: ROLE_NOT_FOUND });
    }

    const result = await RolePermission.findAll({
      where: { id_role: idRole, is_active: "1" },
      group: ['"role_permissions"."id"'],
      attributes: [
        "id_menu_item",
        [
          Sequelize.fn("array_agg", Sequelize.col('"RPA"."id_action"')),
          "access",
        ],
      ],
      include: [
        {
          model: RolePermissionAccess,
          as: "RPA",
          where: [{ access: "1" }],
          attributes: [],
        },
      ],
    });
    return resSuccess({
      data: { id_role: idRole, role_permission_access: result },
    });
  } catch (e) {
    throw e;
  }
};

const validateMenuItemAndAction = async (
  rolePermissionAccessList: IRolePermissionAccess[],
  trn: Transaction | null = null
) => {
  const findMenuItems = await MenuItem.findAll({
    attributes: ["id"],
    where: {
      is_deleted: "0",
      // is_active: "1"
    },
    ...(trn ? { transaction: trn } : {}),
  });

  const findActions = await Action.findAll({
    attributes: ["id"],
    where: {
      is_deleted: "0",
      //  is_active: "1"
    },
    ...(trn ? { transaction: trn } : {}),
  });

  const menuItemList = findMenuItems.map((item) => item.dataValues.id);
  const actionList = findActions.map((item) => item.dataValues.id);

  for (const rolePermissionAccess of rolePermissionAccessList) {
    if (!menuItemList.includes(rolePermissionAccess.id_menu_item)) {
      return resNotFound({ message: MENU_ITEM_NOT_FOUND });
    }
    for (const id of rolePermissionAccess.access) {
      if (!actionList.includes(id)) {
        return resNotFound({ message: ACCESS_NOT_FOUND });
      }
    }
  }

  return resSuccess();
};

export const addRoleConfiguration = async (req: Request) => {
  try {
    const { company_id } = req.body;
    const nameValidaton = await roleWithSameNameValidation(req.body.role_name);
    if (nameValidaton.code !== DEFAULT_STATUS_CODE_SUCCESS) {
      return nameValidaton;
    }

    const validateMenuAction = await validateMenuItemAndAction(
      req.body.role_permission_access
    );
    if (validateMenuAction.code !== DEFAULT_STATUS_CODE_SUCCESS) {
      return validateMenuAction;
    }

    let rolePermissionAccessList = [];
    for (const rpa of req.body.role_permission_access) {
      if (rpa.access.length !== 0) {
        rolePermissionAccessList.push(rpa);
      }
    }

    const findCompany = await Company.findOne({
      where: { id: company_id, is_deleted: DeleteStatus.No },
    })

    if (!(findCompany && findCompany.dataValues)) {
      return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Company"]]) });
    }

    const trn = await dbContext.transaction();
    try {
      const roleResult = await Role.create(
        {
          role_name: req.body.role_name,
          company_id: findCompany.dataValues.id,
          is_active: "1",
          created_by: req.body.session_res.id,
          created_date: getLocalDate(),
        },
        { transaction: trn }
      );

      for (const rolePermissionAccess of rolePermissionAccessList) {
        if (rolePermissionAccess.access.length !== 0) {
          const rpResult = await RolePermission.create(
            {
              id_role: roleResult.dataValues.id,
              id_menu_item: rolePermissionAccess.id_menu_item,
              is_active: "1",
              created_by: req.body.session_res.id,
              created_date: getLocalDate(),
            },
            { transaction: trn }
          );

          for (const idAction of rolePermissionAccess.access) {
            const rpaResult = await RolePermissionAccess.create(
              {
                id_role_permission: rpResult.dataValues.id,
                id_action: idAction,
                access: "1",
                created_by: req.body.session_res.id,
                created_date: getLocalDate(),
              },
              { transaction: trn }
            );
          }
        }
      }

      await trn.commit();
      return resSuccess();
    } catch (e) {
      await trn.rollback();
      throw e;
    }
  } catch (e) {
    throw e;
  }
};

export const updateRoleConfiguration = async (req: Request) => {
  const trn = await dbContext.transaction();
  try {
    const idRole = parseInt(req.params.id);

    const roleToUpdate = await Role.findOne({
      where: { id: idRole, is_deleted: "0" },
    });
    if (!(roleToUpdate && roleToUpdate.dataValues)) {
      return resNotFound({ message: ROLE_NOT_FOUND });
    }

    const nameValidaton = await roleWithSameNameValidation(
      req.body.role_name,
      idRole
    );
    if (nameValidaton.code !== DEFAULT_STATUS_CODE_SUCCESS) {
      await trn.rollback();
      return nameValidaton;
    }

    const validateMenuAction = await validateMenuItemAndAction(
      req.body.role_permission_access,
      trn
    );
    if (validateMenuAction.code !== DEFAULT_STATUS_CODE_SUCCESS) {
      await trn.rollback();
      return validateMenuAction;
    }

    const findCompany = await Company.findOne({
      where: { id: req.body.company_id, is_deleted: DeleteStatus.No },
    })

    if (!(findCompany && findCompany.dataValues)) {
      return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Company"]]) });
    }

    await Role.update(
      {
        company_id: req.body.company_id,
        role_name: req.body.role_name,
        is_active: "1",
        modified_by: req.body.session_res.id,
        modified_date: getLocalDate(),
      },
      { where: { id: idRole }, transaction: trn }
    );

    let rolePermissionAccessList = [];
    for (const rpa of req.body.role_permission_access) {
      if (rpa.access.length !== 0) {
        rolePermissionAccessList.push(rpa);
      }
    }

    await updateRolePermission(
      idRole,
      rolePermissionAccessList,
      req.body.session_res.id,
      trn
    );

    await trn.commit();
    return resSuccess();
  } catch (e) {
    await trn.rollback();
    throw e;
  }
};

const updateRolePermission = async (
  idRole: number,
  rolePermissionAccessList: IRolePermissionAccess[],
  idAppUser: number,
  trn: Transaction
) => {
  let availableRP = await RolePermission.findAll({
    where: { id_role: idRole },
    transaction: trn,
  });

  for (const rolePermissionAccess of rolePermissionAccessList) {
    let idRP: number;
    let findAvailableRP = availableRP.find(
      (item) =>
        item.dataValues.id_menu_item === rolePermissionAccess.id_menu_item
    );

    if (findAvailableRP) {
      idRP = findAvailableRP.dataValues.id;
      availableRP = availableRP.filter((item) => {
        return item.dataValues.id !== idRP;
      });

      if (findAvailableRP.dataValues.is_active === "0") {
        await RolePermission.update(
          {
            is_active: "1",
            modified_by: idAppUser,
            modified_date: getLocalDate(),
          },
          {
            where: {
              id: findAvailableRP.dataValues.id,
            },
            transaction: trn,
          }
        );
      }
    } else {
      const rpResult = await RolePermission.create(
        {
          id_role: idRole,
          id_menu_item: rolePermissionAccess.id_menu_item,
          is_active: "1",
          created_by: idAppUser,
          created_date: getLocalDate(),
        },
        { transaction: trn }
      );
      idRP = rpResult.dataValues.id;
    }

    await updateRolePermissionAccess(
      idRP,
      rolePermissionAccess.access,
      idAppUser,
      trn
    );
  }

  await updateUnavailableMenuPermission(availableRP, idAppUser, trn);
};

const updateRolePermissionAccess = async (
  idRP: number,
  rolePermissionAccessActions: IRolePermissionAccess["access"],
  idAppUser: number,
  trn: Transaction
) => {
  let auditLogPayload = [];
  let availableRPA = await RolePermissionAccess.findAll({
    where: { id_role_permission: idRP },
    transaction: trn,
  });

  for (const idAction of rolePermissionAccessActions) {
    const findRPA = availableRPA.find(
      (item) => item.dataValues.id_action === idAction
    );

    if (findRPA) {
      availableRPA = availableRPA.filter(
        (item) => item.dataValues.id !== findRPA.dataValues.id
      );

      if (findRPA.dataValues.access === "0") {
        auditLogPayload.push({
          id_role_permission_access: findRPA.dataValues.id,
          old_value: "0",
          new_value: "1",
          changed_by: idAppUser,
          changed_date: getLocalDate(),
        });
        await RolePermissionAccess.update(
          {
            access: "1",
            modified_by: idAppUser,
            modified_date: getLocalDate(),
          },
          { where: { id: findRPA.dataValues.id }, transaction: trn }
        );
      }
    } else {
      await RolePermissionAccess.create(
        {
          id_role_permission: idRP,
          id_action: idAction,
          access: "1",
          created_by: idAppUser,
          created_date: getLocalDate(),
        },
        { transaction: trn }
      );
    }
  }

  for (const rpa of availableRPA) {
    if (rpa.dataValues.access === "1") {
      auditLogPayload.push({
        id_role_permission_access: rpa.dataValues.id,
        old_value: "1",
        new_value: "0",
        changed_by: idAppUser,
        changed_date: getLocalDate(),
      });

      await RolePermissionAccess.update(
        {
          access: "0",
          modified_by: idAppUser,
          modified_date: getLocalDate(),
        },
        { where: { id: rpa.dataValues.id }, transaction: trn }
      );
    }
  }

  if (auditLogPayload.length !== 0) {
    await RolePermissionAccessAuditLog.bulkCreate(auditLogPayload, {
      transaction: trn,
    });
  }
};

const updateUnavailableMenuPermission = async (
  unavailableRolePermission: Model<any, any>[],
  idAppUser: number,
  trn: Transaction
) => {
  let auditLogPayload = [];
  for (const rp of unavailableRolePermission) {
    if (rp.dataValues.is_active === "1") {
      await RolePermission.update(
        {
          is_active: "0",
          modified_by: idAppUser,
          modified_date: getLocalDate(),
        },
        { where: { id: rp.dataValues.id }, transaction: trn }
      );

      let availableRPA = await RolePermissionAccess.findAll({
        where: { id_role_permission: rp.dataValues.id },
        transaction: trn,
      });

      for (const rpa of availableRPA) {
        if (rpa.dataValues.access === "1") {
          auditLogPayload.push({
            id_role_permission_access: rpa.dataValues.id,
            old_value: "1",
            new_value: "0",
            changed_by: idAppUser,
            changed_date: getLocalDate(),
          });
          await RolePermissionAccess.update(
            {
              access: "0",
              modified_by: idAppUser,
              modified_date: getLocalDate(),
            },
            {
              where: { id_role_permission: rp.dataValues.id, access: "1" },
              transaction: trn,
            }
          );
        }
      }
    }
  }

  if (auditLogPayload.length !== 0) {
    await RolePermissionAccessAuditLog.bulkCreate(auditLogPayload, {
      transaction: trn,
    });
  }
};

export const getUserAccessMenuItems = async (req: Request) => {
  try {
    const idRole = req.body.session_res.id_role;

    const idAction = 1;

    const result = await MenuItem.findAll({
      order: ["sort_order"],
      attributes: [
        "id",
        "name",
        "id_parent_menu",
        "nav_path",
        "sort_order",
        "icon",
        "menu_location",
      ],
      where: { is_deleted: "0", is_active: "1" },
      include:
        req.body.session_res.user_type === UserType.Admin &&
          req.body.session_res.id_role !== "0"
          ? {
            model: RolePermission,
            as: "RP",
            where: { id_role: idRole, is_active: "1" },
            required: true,
            include: [
              {
                required: true,
                model: RolePermissionAccess,
                as: "RPA",
                where: { id_action: idAction, access: "1" },
              },
            ],
          }
          : [],
    });

    return resSuccess({ data: result });
  } catch (e) {
    throw e;
  }
};

export const addMenuItems = async (req: Request) => {
  try {
    const { name, id_parent_menu, nav_path, menu_location, sort_order, icon } =
      req.body;

    const createMenu = await MenuItem.create({
      name,
      id_parent_menu,
      nav_path,
      menu_location,
      sort_order,
      icon,
      created_by: req.body.session_res.id,
      created_date: getLocalDate(),
      is_active: ActiveStatus.Active,
      is_deleted: DeleteStatus.No,
    });

    return resSuccess({ data: createMenu });
  } catch (error) {
    throw error;
  }
};

export const addPermission = async (req: Request) => {
  try {
    const data = await RoleApiPermission.bulkCreate(req.body.list);

    return resSuccess({ data: data });
  } catch (error) {
    throw error;
  }
};
