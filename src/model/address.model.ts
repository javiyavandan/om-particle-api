import { DATE, INTEGER, SMALLINT, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const Address = dbContext.define("addresses", {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    street_address: {
      type: STRING,
    },
    city: {
      type: STRING
    },
    state: {
      type: STRING
    },
    country: {
      type: SMALLINT,
    },
    zipcode: {
      type: STRING,
    },
    latitude: {
        type: STRING
    },
    longitude: {
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
  
  export default Address;