import { INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const RoleApiPermission = dbContext.define("role_api_permissions", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_menu_item: {
    type: INTEGER,
  },
  id_action: {
    type: INTEGER,
  },
  api_endpoint: {
    type: STRING,
  },
  http_method: {
    type: INTEGER,
  },
  is_active: {
    type: STRING,
  },
  master_type: {
    type: STRING
  }
});

export default RoleApiPermission;
