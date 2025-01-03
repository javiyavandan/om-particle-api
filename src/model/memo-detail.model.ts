import { BIGINT, DATE, STRING } from "sequelize";
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
    deleted_at: {
        type: DATE,
    },
    deleted_by: {
        type: BIGINT,
    },
})

MemoDetail.belongsTo(Memo, {foreignKey: 'memo_id', as: "memo"})
Memo.hasMany(MemoDetail, {foreignKey: 'memo_id', as: "memo_details"})
MemoDetail.belongsTo(Diamonds, {foreignKey: 'stock_id', as: "stocks"})

export default MemoDetail;