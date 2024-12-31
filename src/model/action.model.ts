import { DATE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const Action = dbContext.define("actions", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  action_name: {
    type: STRING,
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

export default Action;
