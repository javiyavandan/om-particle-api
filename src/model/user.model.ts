import { DATE, INTEGER, SMALLINT, STRING } from "sequelize";
import dbContext from "../config/dbContext";


const AppUser = dbContext.define("users", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: STRING,
  },
  email: {
    type: STRING
  },
  phone_number: {
    type: STRING
  },
  user_type: {
    type: SMALLINT,
  },
  is_deleted: {
    type: STRING,
  },
  created_by: {
    type: INTEGER,
  },
  created_at: {
    type: DATE,
  },
  modified_by: {
    type: INTEGER,
  },
  modified_at: {
    type: DATE,
  },
  deleted_at: {
    type: DATE,
  },
  deleted_by: {
    type: INTEGER
  }
});

export default AppUser;