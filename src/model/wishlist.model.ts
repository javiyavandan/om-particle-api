import { INTEGER, JSON, STRING, DATE, BIGINT } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";
import WishlistFolder from "./wishlist-folder";
import Diamonds from "./diamond.model";

const Wishlist = dbContext.define("wishlist_products", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: BIGINT,
  },
  user_id: {
    type: BIGINT,
  },
  folder_id: {
    type: BIGINT,
  },
  created_by: {
    type: BIGINT,
  },
  created_at: {
    type: DATE,
  },
});

Wishlist.belongsTo(AppUser, { foreignKey: "user_id", as: "user" });
Wishlist.belongsTo(WishlistFolder, {
  foreignKey: "folder_id",
  as: "wishlist_folder",
});
Wishlist.belongsTo(Diamonds, { foreignKey: "product_id", as: "product" });

export default Wishlist;
