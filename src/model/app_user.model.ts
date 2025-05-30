import { BIGINT, DATE, JSON, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Image from "./image.model";
import Role from "./role.model";
import File from "./files.model";
import Company from "./companys.model";

const AppUser = dbContext.define("app_users", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  first_name: {
    type: STRING,
  },
  last_name: {
    type: STRING,
  },
  email: {
    type: STRING,
  },
  phone_number: {
    type: STRING,
  },
  password: {
    type: STRING,
  },
  user_type: {
    type: STRING,
  },
  is_verified: {
    type: STRING,
  },
  is_active: {
    type: STRING,
  },
  is_deleted: {
    type: STRING,
  },
  created_by: {
    type: BIGINT,
  },
  created_at: {
    type: DATE,
  },
  modified_by: {
    type: BIGINT,
  },
  modified_at: {
    type: DATE,
  },
  deleted_at: {
    type: DATE,
  },
  deleted_by: {
    type: BIGINT,
  },
  id_role: {
    type: BIGINT,
  },
  token: {
    type: STRING,
  },
  refresh_token: {
    type: STRING,
  },
  one_time_pass: {
    type: STRING,
  },
  approved_date: {
    type: DATE,
  },
  id_image: {
    type: BIGINT,
  },
  id_pdf: {
    type: JSON,
  },
  remarks: {
    type: BIGINT,
  },
  company_id: {
    type: BIGINT,
  },
  memo_terms: {
    type: STRING,
  },
  credit_terms: {
    type: STRING,
  },
  limit: {
    type: STRING,
  },
});

AppUser.belongsTo(Company, { foreignKey: "company_id", as: "company" });
AppUser.belongsTo(Image, { foreignKey: "id_image", as: "image" });
AppUser.belongsTo(Role, { foreignKey: "id_role", as: "role" });
Role.hasMany(AppUser, { foreignKey: "id_role", as: "app_user" });
export default AppUser;
