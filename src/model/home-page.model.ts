import { DATE, DOUBLE, INTEGER, STRING } from "sequelize";
import Image from "./image.model";
import dbContext from "../config/dbContext";
import Master from "./masters.model";

const HomePage = dbContext.define("home_sections", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  section_type: {
    type: STRING,
  },
  title: {
    type: STRING,
  },
  sub_title: {
    type: STRING,
  },
  description: {
    type: STRING,
  },
  button_name: {
    type: STRING,
  },
  button_color: {
    type: STRING,
  },
  link: {
    type: STRING,
  },
  button_text_color: {
    type: STRING,
  },
  sort_order: {
    type: DOUBLE,
  },
  id_image: {
    type: INTEGER,
  },
  id_hover_image: {
    type: INTEGER,
  },
  is_active: {
    type: STRING,
  },
  is_deleted: {
    type: STRING,
  },
  is_button_transparent: {
    type: STRING,
  },
  button_hover_color: {
    type: STRING,
  },
  button_text_hover_color: {
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
  deleted_by: {
    type: INTEGER,
  },
  deleted_date: {
    type: DATE,
  },
  id_diamond_shape: {
    type: INTEGER,
  },
  hash_tag: {
    type: STRING,
  },
  alignment: {
    type: STRING,
  }
});

HomePage.belongsTo(Image, {
  foreignKey: "id_image",
  as: "image",
})
HomePage.belongsTo(Image, {
  foreignKey: "id_hover_image",
  as: "hover_image",
})
HomePage.belongsTo(Master, {
  as: "diamond_shape",
  foreignKey: "id_diamond_shape",
});
export default HomePage;
