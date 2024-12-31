import { DATE, INTEGER, SMALLINT, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const Vehicle = dbContext.define("vehicles", {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category: {
      type: INTEGER,
    },
    passenger_count: {
      type: INTEGER
    },
    color: {
      type: INTEGER
    },
    seat_type: {
      type: INTEGER,
    },
    status: {
        type: STRING
    },
    affiliate_id: {
        type: INTEGER
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
  
  export default Vehicle;