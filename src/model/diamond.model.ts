import { STRING, DATE, BIGINT, DOUBLE } from "sequelize";
import dbContext from "../config/dbContext";
import Master from "./masters.model";
import Company from "./companys.model";

const Diamonds = dbContext.define('diamonds', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    stock_id: {
        type: STRING,
    },
    status: {
        type: STRING,
    },
    is_active: {
        type: STRING,
    },
    is_deleted: {
        type: STRING,
    },
    shape: {
        type: BIGINT,
    },
    quantity: {
        type: BIGINT,
    },
    weight: {
        type: DOUBLE,
    },
    rate: {
        type: DOUBLE,
    },
    color: {
        type: BIGINT,
    },
    color_intensity: {
        type: BIGINT,
    },
    color_over_tone: {
        type: STRING,
    },
    clarity: {
        type: BIGINT,
    },
    lab: {
        type: BIGINT,
    },
    report: {
        type: BIGINT,
    },
    polish: {
        type: BIGINT,
    },
    symmetry: {
        type: BIGINT,
    },
    video: {
        type: STRING,
    },
    image: {
        type: STRING,
    },
    certificate: {
        type: STRING,
    },
    local_location: {
        type: STRING,
    },
    measurement_height: {
        type: DOUBLE,
    },
    measurement_width: {
        type: DOUBLE,
    },
    measurement_depth: {
        type: DOUBLE,
    },
    table_value: {
        type: DOUBLE,
    },
    depth_value: {
        type: DOUBLE,
    },
    ratio: {
        type: STRING,
    },
    fluorescence: {
        type: BIGINT,
    },
    company_id: {
        type: BIGINT,
    },
    user_comments: {
        type: STRING,
    },
    admin_comments: {
        type: STRING,
    },
    loose_diamond: {
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
})

Diamonds.belongsTo(Master, { foreignKey: "clarity", as: "clarity_master" });
Diamonds.belongsTo(Master, { foreignKey: "color", as: "color_master" });
Diamonds.belongsTo(Master, { foreignKey: "color_intensity", as: "color_intensity_master" });
Diamonds.belongsTo(Master, { foreignKey: "lab", as: "lab_master" });
Diamonds.belongsTo(Company, { foreignKey: "company_id", as: "company_master" });
Diamonds.belongsTo(Master, { foreignKey: "polish", as: "polish_master" });
Diamonds.belongsTo(Master, { foreignKey: "shape", as: "shape_master" });
Diamonds.belongsTo(Master, { foreignKey: "symmetry", as: "symmetry_master" });
Diamonds.belongsTo(Master, { foreignKey: "fluorescence", as: "fluorescence_master" });

export default Diamonds;