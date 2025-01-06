import { BIGINT, DATE, INTEGER, JSON, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";
import Diamonds from "./diamond.model";

const CartProducts = dbContext.define("cart_products", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: BIGINT,
  },
  product_id: {
    type: BIGINT,
  },
  quantity: {
    type: INTEGER,
  },
  created_at: {
    type: DATE,
  },
  created_by: {
    type: INTEGER,
  },
});

CartProducts.belongsTo(AppUser, { foreignKey: "user_id", as: "user" });
CartProducts.belongsTo(Diamonds, {foreignKey: "product_id", as: "product"});

export default CartProducts;
