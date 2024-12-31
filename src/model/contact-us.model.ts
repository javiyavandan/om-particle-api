import { BIGINT, DATE, STRING } from "sequelize";
import dbContext from "../config/dbContext";

const ContactUs = dbContext.define("contact-us", {
  id: {
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
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
  message: {
    type: STRING,
  },
  created_at: {
    type: DATE,
  },
});

export default ContactUs;