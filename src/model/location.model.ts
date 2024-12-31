import { STRING, DATE, BIGINT } from "sequelize";
import dbContext from "../config/dbContext";

const Location = dbContext.define("locations", {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
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
    deleted_by: {
        type: BIGINT,
    },
    deleted_at: {
        type: DATE,
    },
});


export default Location;