import { DATE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";
import Image from "./image.model";

const BusinessUser = dbContext.define("business_users", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_app_user: {
    type: INTEGER,
  },
  name: {
    type: STRING,
  },
  email: {
    type: STRING,
  },
  phone_number: {
    type: STRING,
  },
  is_active: {
    type: STRING,
  },
  is_deleted: {
    type: STRING,
  },
  created_by: {
    type: INTEGER,
  },
  created_date: {
    type: DATE,
  },
  modified_by: {
    type: INTEGER,
  },
  modified_date: {
    type: DATE,
  },
  id_image: {
    type: INTEGER,
  },
});

BusinessUser.belongsTo(AppUser, { foreignKey: "id_app_user", as: "app_user" });
AppUser.hasMany(BusinessUser, {
  foreignKey: "id_app_user",
  as: "business_users",
});

BusinessUser.belongsTo(Image, { foreignKey: "id_image", as: "image" });
Image.hasOne(BusinessUser, { foreignKey: "id_image", as: "image" });

export default BusinessUser;
