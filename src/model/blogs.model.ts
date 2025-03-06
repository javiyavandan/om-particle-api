import { BIGINT, DATE, TEXT, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Image from "./image.model";
import AppUser from "./app_user.model";

const Blogs = dbContext.define('blogs', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: STRING,
        allowNull: false,
    },
    slug:{
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
    updated_by: {
        type: BIGINT,
    },
    updated_at: {
        type: DATE,
    },
    deleted_at: {
        type: DATE,
    },
    deleted_by: {
        type: BIGINT,
    },
})

Blogs.belongsTo(Image, { foreignKey: 'id_image', as: "image" })
Blogs.belongsTo(AppUser, { foreignKey: 'created_by', as: "created" })
Blogs.belongsTo(AppUser, { foreignKey: 'updated_by', as: "updated" })
Blogs.belongsTo(AppUser, { foreignKey: 'deleted_by', as: "delete" })

export default Blogs;