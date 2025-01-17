import { BIGINT, DATE, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const Country = dbContext.define("countrys", {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: STRING,
        allowNull: false,
        unique: true,
    },
    slug: {
        type: STRING,
        allowNull: false,
        unique: true,
    },
    code: {
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

export default Country;