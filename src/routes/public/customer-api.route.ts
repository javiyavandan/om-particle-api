import { Router } from "express";
import { checkStockStatusApiFn, getStockDetailApiForCustomerFn, getStockListApiForCustomerFn, updateStockStatusFromCustomerFn } from "../../controllers/admin/apis.controller";

export default (app: Router) => {
    app.get("/stock-list/:api_key", getStockListApiForCustomerFn)
    app.get("/stock-list/:api_key/:stock_id", getStockDetailApiForCustomerFn)
    app.get("/check-stock/:api_key/:stock_id", checkStockStatusApiFn)
    app.put("/update-stock/:api_key/:status", updateStockStatusFromCustomerFn)
}