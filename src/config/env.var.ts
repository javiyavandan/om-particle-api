require('dotenv').config({ path: 'environment/.env.' + process.env.NODE_ENV });

export const PORT = process.env.PORT || 2526;
export const SECURE_COMMUNICATION = process.env.SECURE_COMMUNICATION
  ? process.env.SECURE_COMMUNICATION === "true"
  : false;

export const DB_NAME = process.env.DB_NAME || "OML";
export const DB_USER_NAME = process.env.DB_USER_NAME || "postgres";
export const DB_PASSWORD = process.env.DB_PASSWORD || "Vihaa2410";
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT || 5432;
export const SEQUELIZE_DIALECT = process.env.SEQUELIZE_DIALECT || "postgres";

export const HUBSPOT_TOKEN =
  process.env.HUBSPOT_TOKEN;
export const HUBSPOT_SYNC_URL =
  process.env.HUBSPOT_SYNC_URL || "https://api.hubapi.com";
export const FRONT_END_BASE_URL =
  process.env.FRONT_END_BASE_URL || "http://localhost:3000";
export const RESET_PASSWORD_PATH =
  process.env.RESET_PASSWORD_PATH || "/reset-password?token=";
export const IMAGE_PATH =
  process.env.IMAGE_PATH || "";
export const IMAGE_URL =
  process.env.IMAGE_URL || "https://d3d05p2gd539q7.cloudfront.net/";

export const OTP_GENERATE_DIGITS = 6;
export const SHARE_PRODUCT_PATH =
  process.env.SHARE_PRODUCT_PATH || "/share-list?id=";

export const PUBLIC_AUTHORIZATION_TOKEN =
  process.env.PUBLIC_AUTHORIZATION_TOKEN || "PUBLIC_AUTHORIZATION_TOKEN";
  
export const STORE_TEMP_IMAGE_PATH =
process.env.STORE_TEMP_IMAGE_PATH || "public/temp/images";

export const STORE_TEMP_FILE_PATH =
process.env.STORE_TEMP_FILE_PATH || "public/temp/files";
export const APP_NAME = process.env.APP_NAME || "OML";

// AWS S3
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "purelab";
export const S3_REGION = process.env.S3_REGION || "ap-south-1";
export const S3_ACCESS_KEY_ID =
  process.env.S3_ACCESS_KEY_ID;
export const S3_SECRET_ACCESS_KEY =
  process.env.S3_SECRET_ACCESS_KEY;

  
// Mail
// SMTP
export const MAIL_USER_NAME =
process.env.MAIL_USER_NAME || "noreply@vihaainfotech.com";
export const MAIL_PASSWORD = process.env.MAIL_PASSWORD || "Vihaa@2015";
export const MAIL_HOST = process.env.MAIL_HOST || "mail.vihaainfotech.com";
export const MAIL_PORT = process.env.MAIL_PORT || 465;
export const MAIL_SECURE = process.env.MAIL_SECURE || false;
export const MAIL_FROM = process.env.MAIL_FROM || "noreply@vihaainfotech.com";

export const ADMIN_MAIL = "info@oml.com";
