import { BIGINT, DATE, INTEGER, SMALLINT, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";

const Address = dbContext.define("addresses", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: BIGINT,
  },
  first_name: {
    type: STRING,
  },
  last_name: {
    type: STRING,
  },
  phone_number: {
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
    type: SMALLINT,
  },
  postcode: {
    type: STRING,
  },
  is_default: {
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
});

Address.belongsTo(AppUser, { foreignKey: "user_id", as: "app_users" });

export default Address;
