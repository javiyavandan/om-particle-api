import { BIGINT, DOUBLE } from "sequelize";
import dbContext from "../config/dbContext";
import Diamonds from "./diamond.model";
import Apis from "./apis";

const ApiStockDetails = dbContext.define("api_stock_details", {
    id: {
        type: BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    stock_id: {
        type: BIGINT,
        allowNull: false,
    },
    price: {
        type: DOUBLE,
        allowNull: false,
    },
    api_id: {
        type: BIGINT,
        allowNull: false
    }
})

Apis.hasOne(ApiStockDetails, { foreignKey: "api_id", as: "api_detail" })
ApiStockDetails.belongsTo(Diamonds, { foreignKey: "stock_id", as: "stock" })
ApiStockDetails.belongsTo(Apis, { foreignKey: "api_id", as: "apis" })

export default ApiStockDetails