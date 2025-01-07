import { Router } from "express";
import { getStockDetailFn, getStockListFn } from "../../controllers/user/stock.controller";

export default (app: Router) => {
    app.get("/stock", getStockListFn)
    app.get("/stock/:stock_id", getStockDetailFn)
}