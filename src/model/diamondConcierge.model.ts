import { BIGINT, DATE, DOUBLE, INTEGER, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import AppUser from "./app_user.model";
import Master from "./masters.model";
import Image from "./image.model";

const DiamondConcierge = dbContext.define("diamond_concierges", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: BIGINT
  },
  product_id: {
    type: BIGINT,
  },
  name: {
    type: STRING,
  },
  message: {
    type: STRING,
  },
  email: {
    type: STRING,
  },
  phone_number: {
    type: STRING,
  },
  shape: {
    type: BIGINT,
  },
  stones: {
    type: BIGINT,
  },
  weight: {
    type: DOUBLE,
  },
  measurement: {
    type: DOUBLE,
  },
  color: {
    type: BIGINT,
  },
  clarity: {
    type: BIGINT,
  },
  certificate: {
    type: STRING,
  },
  id_image: {
    type: BIGINT,
  },
  created_at: {
    type: DATE,
  },
  created_by: {
    type: BIGINT,
  },
});

DiamondConcierge.belongsTo(AppUser, { foreignKey: "user_id", as: "user" });
DiamondConcierge.belongsTo(Master, {foreignKey: "shape", as: "shapeData"})
DiamondConcierge.belongsTo(Master, {foreignKey: "stones", as: "stonesData"})
DiamondConcierge.belongsTo(Master, {foreignKey: "color", as: "colorData"})
DiamondConcierge.belongsTo(Master, {foreignKey: "clarity", as: "clarityData"})
DiamondConcierge.belongsTo(Image, {foreignKey: "id_image", as: "image"})

export default DiamondConcierge;
