import { BIGINT, DATE, JSON, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Customer from "./customer.modal";
import Company from "./companys.model";

const Apis = dbContext.define("apis", {
    id: {
        type: BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    customer_id: {
        type: BIGINT,
        allowNull: false,
    },
    company_id: {
        type: BIGINT,
        allowNull: false,
    },
    api_key: {
        type: STRING,
        allowNull: false,
        unique: true,
    },
    column_array: {
        type: JSON,
        allowNull: false
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
        type: BIGINT,
    },
})

Apis.belongsTo(Customer, {foreignKey: "customer_id", as: "customer"})
Apis.belongsTo(Company, {foreignKey: "company_id", as: "company"})

export default Apis