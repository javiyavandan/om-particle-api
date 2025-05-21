import { BIGINT, DOUBLE, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import StockTransfer from "./stock-transfer.model";
import Diamonds from "./diamond.model";

const TransferDetails = dbContext.define("transfer_details", {
    id: {
        type: BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    transfer_id: {
        type: BIGINT,
        allowNull: false,
    },
    stock_id: {
        type: BIGINT,
        allowNull: false,
    },
    sender_price: {
        type: DOUBLE,
        allowNull: false,
    },
    receiver_price: {
        type: DOUBLE,
        allowNull: false,
    },
    status: {
        type: STRING,
    },
})

TransferDetails.belongsTo(StockTransfer, { foreignKey: "transfer_id", as: "transfer" })
TransferDetails.belongsTo(Diamonds, { foreignKey: "stock_id", as: "diamonds" })

export default TransferDetails