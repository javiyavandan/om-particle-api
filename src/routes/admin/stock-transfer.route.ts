import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { CreateTransferRequestFn } from "../../controllers/admin/stock-transfer.controller";
import { addStockTransferValidator } from "../../validators/stock-transfer/stock.validator";

export default (app: Router) => {
    app.post("/stock-transfer", [adminAuthorization, addStockTransferValidator], CreateTransferRequestFn)
}