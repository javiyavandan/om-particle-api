import { DATE, INTEGER, SMALLINT, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const Affiliate = dbContext.define("affiliates", {
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
    website: {
        type: STRING
    },
    address_id: {
        type: INTEGER
    },
    dot_number: {
        type: STRING
    },
    is_cross_state_insured: {
        type: STRING
    },
    status: {
        type: INTEGER
    },
    admin_note: {
        type: STRING
    },
    commission_percentage: {
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
  
  export default Affiliate;