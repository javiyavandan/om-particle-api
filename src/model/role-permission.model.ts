import { DATE, INTEGER, STRING } from "sequelize";
import MenuItem from "./menu-items.model";
import RolePermissionAccess from "./role-permission-access.model";
import Role from "./role.model";
import dbContext from "../config/dbContext";

const RolePermission = dbContext.define("role_permissions", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_role: {
    type: INTEGER,
  },
  id_menu_item: {
    type: INTEGER,
  },
  is_active: {
    type: STRING,
  },
  created_by: {
    type: INTEGER,
  },
  created_date: {
    type: DATE,
  },
  modified_by: {
    type: INTEGER,
  },
  modified_date: {
    type: DATE,
  },
});

RolePermission.belongsTo(Role, {
  foreignKey: "id_role",
  as: "role",
});

Role.hasMany(RolePermission, { foreignKey: "id_role", as: "RP" });

RolePermission.hasMany(RolePermissionAccess, {
  foreignKey: "id_role_permission",
  as: "RPA",
});

RolePermissionAccess.belongsTo(RolePermission, {
  foreignKey: "id_role_permission",
  as: "RP",
});

RolePermission.belongsTo(MenuItem, {
  foreignKey: "id_menu_item",
  as: "menu_item",
});

MenuItem.hasMany(RolePermission, { foreignKey: "id_menu_item", as: "RP" });

export default RolePermission;
