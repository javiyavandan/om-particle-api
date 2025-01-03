import { BIGINT, DATE } from "sequelize";
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
    company_id: {
        type: DATE,
    },
    customer_id: {
        type: DATE,
    },
    tax_id: {
        type: DATE,
    },
    created_at: {
        type: DATE,
    },
    created_by: {
        type: BIGINT,
    }
});

Invoice.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Invoice.belongsTo(Master, { foreignKey: 'tax_id', as: 'tax_master' });

export default Invoice;