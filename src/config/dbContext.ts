import { Dialect, Sequelize } from "sequelize";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER_NAME, SEQUELIZE_DIALECT } from "./env.var";

const dbContext = new Sequelize(DB_NAME, DB_USER_NAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: SEQUELIZE_DIALECT as Dialect,
  port: Number(DB_PORT),
  define: {
    timestamps: false, // I do not want timestamp fields by default (createdAt, updatedAt)
  },
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
    // useUTC: false, //for reading from database
  },
});

export default dbContext