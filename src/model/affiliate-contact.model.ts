import { DATE, INTEGER, SMALLINT, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const AffiliateContact = dbContext.define("affiliate_contacts", {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    affiliate_id: {
      type: INTEGER,
    },
    user_id: {
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
    deleted_at: {
      type: DATE,
    },
    deleted_by: {
      type: INTEGER
    }
  });
  
  export default AffiliateContact;