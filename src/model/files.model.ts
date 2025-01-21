import { BIGINT, DATE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const File = dbContext.define("files", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  file_path: {
    type: STRING
  },
  is_deleted: {
    type: STRING
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
    type: INTEGER
  },
  file_type: {
    type: STRING
  },
});

export default File