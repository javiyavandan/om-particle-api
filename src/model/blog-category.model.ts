import { BIGINT, DATE, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const BlogCategory = dbContext.define("blog_categories", {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: STRING,
    },
    slug: {
        type: STRING,
    },
    sort_order: {
        type: BIGINT,
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
})

export default BlogCategory