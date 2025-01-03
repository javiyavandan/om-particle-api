import { INTEGER, STRING, DATE, BIGINT } from "sequelize";
import dbContext from "../config/dbContext";
import Image from "./image.model";
import Company from "./companys.model";

const Master = dbContext.define("masters", {
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
  sort_code: {
    type: STRING,
  },
  value: {
    type: STRING,
  },
  link: {
    type: STRING,
  },
  order_by: {
    type: INTEGER,
  },
  stone_type: {
    type: STRING,
  },
  master_type: {
    type: STRING,
  },
  import_name: {
    type: STRING,
  },
  id_image: {
    type: BIGINT,
  },
  id_parent: {
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
  deleted_at: {
    type: DATE,
  },
  deleted_by: {
    type: BIGINT,
  },
  company_id: {
    type: BIGINT,
  }
});

Master.belongsTo(Image, { foreignKey: "id_image", as: "image" });
Master.belongsTo(Company, { foreignKey: "company_id", as: "company" });

export default Master;
