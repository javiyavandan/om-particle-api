import { BIGINT, DATE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const WishlistFolder = dbContext.define("wishlist_folders", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: STRING,
  },
  user_id: {
    type: BIGINT,
  },
  created_by: {
    type: BIGINT,
  },
  created_at: {
    type: DATE,
  },
});

export default WishlistFolder;
