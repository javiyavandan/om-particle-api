import { BIGINT, DATE, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const Currency = dbContext.define('currency_masters', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: STRING,
        allowNull: false
    },
    name: {
        type: STRING,
        allowNull: false
    },
    symbol: {
        type: STRING,
        allowNull: false
    },
    format: {
        type: STRING,
        allowNull: false
    },
    is_default:{
        type: STRING,
    },
    is_active: {
        type: STRING,
    },
    is_deleted: {
        type: STRING,
    },
    created_by: {
        type: BIGINT,
    },
    created_at: {
        type: DATE,
    },
    modified_by: {
        type: BIGINT,
    },
    modified_at: {
        type: DATE,
    },
    deleted_at: {
        type: DATE,
    },
    deleted_by: {
        type: BIGINT
    },
})


export default Currency;