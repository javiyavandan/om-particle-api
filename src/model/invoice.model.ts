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
    }
});

Invoice.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

export default Invoice;