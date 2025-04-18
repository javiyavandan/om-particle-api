import { BIGINT, DATE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Company from "./companys.model";

const Role = dbContext.define("roles", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_name: {
    type: STRING,
  },
  company_id: {
    type: BIGINT,
  },
  is_active: {
    type: STRING,
  },
  is_deleted: {
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

Role.belongsTo(Company, { foreignKey: "company_id", as: "company_master" });

export default Role;
