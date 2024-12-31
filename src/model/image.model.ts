import { BIGINT, DATE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const Image = dbContext.define("images", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  image_path: {
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
  image_type: {
    type: STRING
  },
});

export default Image