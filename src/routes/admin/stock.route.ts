import { Router } from "express";
import { addStockFn } from "../../controllers/admin/stock.controller";
import { adminAuthorization } from "../../middlewares/authenticate";
import { addStockValidator } from "../../validators/stock/stock.validator";
export default (app: Router) => {

    // ---- add stock ---- //
    app.post("/stock", [adminAuthorization, addStockValidator], addStockFn);
}