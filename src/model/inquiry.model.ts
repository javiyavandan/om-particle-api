import { BIGINT, DATE, DOUBLE, JSON, STRING, TEXT } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";

const Inquiry = dbContext.define('inquiries', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    inquiry_number: {
        type: STRING,
    },
    user_id: {
        type: BIGINT,
    },
    total: {
        type: DOUBLE
    },
    product_details: {
        type: JSON,
    },
    inquiry_note: {
        type: TEXT,
    },
    email: {
        type: STRING,
    },
    inquiry_address: {
        type: JSON,
    },
    created_at: {
        type: DATE
    },
    created_by: {
        type: BIGINT
    }
})

Inquiry.belongsTo(AppUser, { foreignKey: 'user_id', as: 'user' })

export default Inquiry