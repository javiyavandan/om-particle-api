import { BIGINT, DATE, JSON } from "sequelize";
import dbContext from "../config/dbContext";

const CurrencyJson = dbContext.define("currency_jsons", {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    json: {
        type: JSON,
        allowNull: false,
    },
    date: {
        type: DATE,
        allowNull: false,
    },
    created_at: {
        type: DATE,
        allowNull: false,
    }
});

export default CurrencyJson;