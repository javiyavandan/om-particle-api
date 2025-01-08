import { STRING, DATE, BIGINT } from "sequelize";
import dbContext from "../config/dbContext";
import Country from "./country.model";

const Company = dbContext.define("companys", {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: STRING,
    },
    registration_number: {
        type: STRING,
    },
    country_id: {
        type: BIGINT,
    },
    ac_holder: {
        type: STRING,
    },
    bank_name: {
        type: STRING,
    },
    ac_number: {
        type: BIGINT,
    },
    bank_branch: {
        type: STRING,
    },
    bank_branch_code: {
        type: STRING,
    },
    company_address: {
        type: STRING,
    },
    city: {
        type: STRING,
    },
    pincode: {
        type: STRING,
    },
    phone_number: {
        type: STRING,
    },
    email: {
        type: STRING,
    },
    state: {
        type: STRING,
    },
    map_link: {
        type: STRING,
    },
    contact_person: {
        type: STRING,
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
    deleted_by: {
        type: BIGINT,
    },
    deleted_at: {
        type: DATE,
    },
});

Company.belongsTo(Country, { foreignKey: "country_id", as: 'country' });


export default Company;