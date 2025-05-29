import { BIGINT, DATE, TEXT, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Image from "./image.model";
import AppUser from "./app_user.model";
import BlogCategory from "./blog-category.model";

const Blogs = dbContext.define('blogs', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    meta_title: {
        type: STRING,
        allowNull: false,
    },
    meta_description: {
        type: STRING,
    },
    meta_keywords: {
        type: STRING,
    },
    title: {
        type: STRING,
        allowNull: false,
    },
    slug: {
        type: STRING,
        allowNull: false,
    },
    description: {
        type: TEXT,
    },
    sort_description: {
        type: STRING,
    },
    id_image: {
        type: BIGINT,
    },
    id_banner_image: {
        type: BIGINT,
    },
    author: {
        type: STRING,
        allowNull: false
    },
    id_category: {
        type: BIGINT,
        allowNull: false
    },
    sort_order: {
        type: BIGINT,
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

BlogCategory.hasOne(Blogs, { foreignKey: 'id_category', as: 'blogs' })
Blogs.belongsTo(Image, { foreignKey: 'id_image', as: "image" })
Blogs.belongsTo(Image, { foreignKey: 'id_banner_image', as: "banner" })
Blogs.belongsTo(BlogCategory, { foreignKey: 'id_category', as: "category" })
Blogs.belongsTo(AppUser, { foreignKey: 'created_by', as: "created" })
Blogs.belongsTo(AppUser, { foreignKey: 'modified_by', as: "modified" })
Blogs.belongsTo(AppUser, { foreignKey: 'deleted_by', as: "delete" })

export default Blogs;