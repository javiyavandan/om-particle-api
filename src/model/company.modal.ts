import { BIGINT, DATE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";

const Company = dbContext.define("company_masters", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: BIGINT,
  },
  company_name: {
    type: STRING,
  },
  company_website: {
    type: STRING,
  },
  company_email: {
    type: STRING,
  },
  registration_number: {
    type: STRING,
  },
  address: {
    type: STRING,
  },
  city: {
    type: STRING,
  },
  state: {
    type: STRING,
  },
  country: {
    type: STRING,
  },
  postcode: {
    type: INTEGER,
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
    type: BIGINT
  },
});
AppUser.hasOne(Company, {foreignKey: "user_id", "as": "company"})
Company.belongsTo(AppUser, {foreignKey: "user_id", as: "user"})

export default Company