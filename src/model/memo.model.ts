import { BIGINT, DATE, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Company from "./companys.model";
import Customer from "./customer.modal";

const Memo = dbContext.define('memos', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    company_id: {
        type: BIGINT,
        allowNull: false,
    },
    customer_id: {
        type: BIGINT,
        allowNull: false,
    },
    memo_number: {
        type: BIGINT,
        allowNull: false,
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
    due_date: {
        type: DATE,
    },
    status: {
        type: STRING,
    }
})

Memo.belongsTo(Company, { foreignKey: 'company_id', as: "company" });
Memo.belongsTo(Customer, { foreignKey: 'customer_id', as: "customer" });

export default Memo;