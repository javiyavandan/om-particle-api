import { BIGINT, DATE, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Diamonds from "./diamond.model";
import Invoice from "./invoice.model";

const InvoiceDetail = dbContext.define("invoice_details", {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: BIGINT,
    },
    stock_id: {
        type: BIGINT
    },
    stock_price: {
        type: BIGINT
    },
    is_return: {
        type: STRING,
    }
})

InvoiceDetail.belongsTo(Invoice, {foreignKey: 'invoice_id', as: "invoice"})
Invoice.hasMany(InvoiceDetail, {foreignKey: 'invoice_id', as: "invoice_details"})
InvoiceDetail.belongsTo(Diamonds, {foreignKey: 'stock_id', as: "stocks"})

export default InvoiceDetail;