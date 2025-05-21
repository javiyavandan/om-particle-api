import { BIGINT, DATE, DOUBLE, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";
import Company from "./companys.model";

const StockTransfer = dbContext.define("stock-transfer", {
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
    duration: {
        type: STRING,
    },
    status: {
        type: STRING,
    },
    delivery_challan_no: {
        type: STRING,
        allowNull: false,
    },
    pre_carriage: {
        type: STRING,
        allowNull: false,
    },
    vessels_flight_no: {
        type: STRING,
        allowNull: false,
    },
    hsn_code: {
        type: STRING,
        allowNull: false,
    },
    description: {
        type: STRING,
        allowNull: false,
    },
    diamond_description: {
        type: STRING,
        allowNull: false,
    },
    consignment_remarks: {
        type: STRING,
        allowNull: false,
    },
    total_quantity: {
        type: BIGINT,
        allowNull: false,
    },
    total_amount: {
        type: DOUBLE,
        allowNull: false,
    },
    total_weight: {
        type: DOUBLE,
        allowNull: false,
    },
    average_amount: {
        type: DOUBLE,
        allowNull: false,
    },
    return_total_quantity: {
        type: BIGINT,
        allowNull: false,
    },
    return_total_amount: {
        type: DOUBLE,
        allowNull: false,
    },
    return_total_weight: {
        type: DOUBLE,
        allowNull: false,
    },
    return_average_amount: {
        type: DOUBLE,
        allowNull: false,
    },
})

StockTransfer.belongsTo(AppUser, { foreignKey: "accepted_by", as: "accepted" })
StockTransfer.belongsTo(AppUser, { foreignKey: "created_by", as: "created" })
StockTransfer.belongsTo(AppUser, { foreignKey: "rejected_by", as: "rejected" })
StockTransfer.belongsTo(AppUser, { foreignKey: "close_by", as: "close" })
StockTransfer.belongsTo(Company, { foreignKey: "receiver", as: "to" })
StockTransfer.belongsTo(Company, { foreignKey: "sender", as: "from" })

export default StockTransfer