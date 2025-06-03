import { BIGINT, DATE, STRING, TEXT } from "sequelize";
import dbContext from "../config/dbContext";

const StockLogs = dbContext.define("stock_logs", {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    change_at: {
        type: DATE
    },
    change_by: {
        type: STRING
    },
    change_by_id: {
        type: BIGINT
    },
    reference_id: {
        type: BIGINT
    },
    description: {
        type: TEXT
    },
    log_type: {
        type: STRING
    },
    action_type: {
        type: STRING
    },
})

export default StockLogs