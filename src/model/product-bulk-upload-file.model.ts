import { DATE, INTEGER, JSON, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const ProductBulkUploadFile = dbContext.define("product_bulk_upload_files", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  file_path: {
    type: STRING,
  },
  status: {
    type: INTEGER,
  },
  error: {
    type: JSON,
  },
  file_type: {
    type: INTEGER,
  },
  created_by: {
    type: INTEGER,
  },
  created_date: {
    type: DATE,
  },
  modified_date: {
    type: DATE,
  },
});

export default ProductBulkUploadFile;
