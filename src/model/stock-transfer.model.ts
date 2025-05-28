import { BIGINT, DATE, DOUBLE, JSON, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";
import Company from "./companys.model";

const StockTransfer = dbContext.define("stock_transfers", {
    id: {
        type: BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    receiver: {
        type: BIGINT,
        allowNull: false
    },
    sender: {
        type: BIGINT,
        allowNull: false
    },
    created_at: {
        type: DATE,
        allowNull: false
    },
    created_by: {
        type: BIGINT,
        allowNull: false
    },
    accepted_at: {
        type: DATE,
    },
    accepted_by: {
        type: BIGINT,
    },
    rejected_at: {
        type: DATE,
    },
    rejected_by: {
        type: BIGINT,
    },
    close_at: {
        type: DATE,
    },
    close_by: {
        type: BIGINT,
    },
    return_at: {
        type: DATE,
    },
    return_by: {
        type: BIGINT,
    },
    duration: {
        type: STRING,
    },
    status: {
        type: STRING,
    },
    consignment_details: {
        type: JSON,
        allowNull: false,
    },
    return_details: {
        type: JSON,
    }
})

StockTransfer.belongsTo(AppUser, { foreignKey: "accepted_by", as: "accepted" })
StockTransfer.belongsTo(AppUser, { foreignKey: "created_by", as: "created" })
StockTransfer.belongsTo(AppUser, { foreignKey: "rejected_by", as: "rejected" })
StockTransfer.belongsTo(AppUser, { foreignKey: "close_by", as: "close" })
StockTransfer.belongsTo(Company, { foreignKey: "receiver", as: "to" })
StockTransfer.belongsTo(Company, { foreignKey: "sender", as: "from" })

export default StockTransfer