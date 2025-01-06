import { BIGINT, DATE, STRING, TEXT } from "sequelize";
import dbContext from "../config/dbContext";
import Diamonds from "./diamond.model";

const ProductInquiry = dbContext.define('product_inquiries', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    full_name: {
        type: STRING
    },
    email: {
        type: STRING
    },
    phone_number: {
        type: STRING
    },
    message: {
        type: TEXT
    },
    admin_comments: {
        type: TEXT
    },
    product_id: {
        type: BIGINT
    },
    created_by: {
        type: BIGINT
    },
    created_at: {
        type: DATE
    },
    modified_by: {
        type: BIGINT
    },
    modified_at: {
        type: DATE
    }
})

ProductInquiry.belongsTo(Diamonds, {foreignKey: 'product_id', as: "product"})

export default ProductInquiry;