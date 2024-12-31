import { DATE, INTEGER, SMALLINT, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const UserCredential = dbContext.define("user_credentials", {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: INTEGER,
    },
    password: {
      type: STRING
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
  
  export default UserCredential;