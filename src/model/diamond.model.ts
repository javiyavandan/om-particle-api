import { STRING, DATE, BIGINT, DOUBLE } from "sequelize";
import dbContext from "../config/dbContext";
import Master from "./masters.model";
import Location from "./location.model";

const Diamonds = dbContext.define('diamonds', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    stock_id: {
        type: STRING,
    },
    available: {
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
    piece: {
        type: BIGINT,
    },
    weight: {
        type: DOUBLE,
    },
    rate: {
        type: BIGINT,
    },
    color: {
        type: BIGINT,
    },
    color_intensity: {
        type: BIGINT,
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
    measurement: {
        type: STRING,
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
    flo: {
        type: STRING,
    },
    location_id: {
        type: BIGINT,
    },
    comments: {
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

Diamonds.belongsTo(Master, { foreignKey: "clarity", as: "clarity" });
Diamonds.belongsTo(Master, { foreignKey: "color", as: "color" });
Diamonds.belongsTo(Master, { foreignKey: "color_intensity", as: "color_intensity" });
Diamonds.belongsTo(Master, { foreignKey: "lab", as: "lab" });
Diamonds.belongsTo(Location, { foreignKey: "location_id", as: "location" });
Diamonds.belongsTo(Master, { foreignKey: "polish", as: "polish" });
Diamonds.belongsTo(Master, { foreignKey: "shape", as: "shape" });
Diamonds.belongsTo(Master, { foreignKey: "symmetry", as: "symmetry" });

export default Diamonds;