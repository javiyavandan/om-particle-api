import { BIGINT, DATE, DOUBLE, STRING } from "sequelize";
import dbContext from "../config/dbContext";
import Memo from "./memo.model";
import Diamonds from "./diamond.model";

const MemoDetail = dbContext.define("memo_details", {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    memo_id: {
        type: BIGINT,
    },
    stock_id: {
        type: BIGINT
    },
    stock_price: {
        type: BIGINT
    },
    stock_original_price: {
        type: BIGINT
    },
    is_deleted: {
        type: STRING
    },
    is_return: {
        type: STRING
    },
    memo_type: {
        type: STRING
    },
    quantity: {
        type: BIGINT,
    },
    weight: {
        type: DOUBLE,
    },
    deleted_at: {
        type: DATE,
    },
    deleted_by: {
        type: BIGINT,
    },
})

MemoDetail.belongsTo(Memo, { foreignKey: 'memo_id', as: "memo" })
Memo.hasMany(MemoDetail, { foreignKey: 'memo_id', as: "memo_details" })

export default MemoDetail;