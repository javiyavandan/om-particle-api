import { BIGINT, DATE, DOUBLE, JSON, TEXT } from "sequelize";
import dbContext from "../config/dbContext";
import Company from "./companys.model";
import Customer from "./customer.modal";
import Master from "./masters.model";

const Invoice = dbContext.define('invoices', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_number: {
        type: BIGINT,
    },
    remarks: {
        type: TEXT
    },
    company_id: {
        type: BIGINT,
    },
    customer_id: {
        type: BIGINT,
    },
    created_at: {
        type: DATE,
    },
    created_by: {
        type: BIGINT,
    },
    tax_data: {
        type: JSON,
    },
    total_item_price: {
        type: DOUBLE,
    },
    total_tax_price: {
        type: DOUBLE,
    },
    total_price: {
        type: DOUBLE,
    },
    total_weight: {
        type: DOUBLE,
    },
    total_diamond_count: {
        type: DOUBLE,
    }
});

Invoice.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

export default Invoice;