import { BIGINT, DATE, DOUBLE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Diamonds from "./diamond.model";

const ShareProducts = dbContext.define("share_products", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  share_id: {
    type: STRING,
  },
  created_at: {
    type: DATE,
  },
  cretaed_by: {
    type: BIGINT,
  },
  phone_number: {
    type: STRING,
  },
  id_product: {
    type: BIGINT,
  },
  price: {
    type: DOUBLE,
  },
});
ShareProducts.belongsTo(Diamonds, {
  foreignKey: "id_product",
  as: "diamond_product",
});
export default ShareProducts;
