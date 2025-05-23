import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { AcceptTransferRequestFn, CloseTransferRequestFn, CreateTransferRequestFn, GetAllTransferRequestFn, GetTransferRequestByIdFn, RejectTransferRequestFn, ReturnStockTransferRequestFn } from "../../controllers/admin/stock-transfer.controller";
import { addStockTransferValidator, returnStockTransferValidator } from "../../validators/stock-transfer/stock-transfer.validator";

export default (app: Router) => {
    app.post("/stock-transfer", [adminAuthorization, addStockTransferValidator], CreateTransferRequestFn)
    app.patch("/stock-transfer/accept/:transfer_id", [adminAuthorization], AcceptTransferRequestFn)
    app.patch("/stock-transfer/reject/:transfer_id", [adminAuthorization], RejectTransferRequestFn)
    app.post("/stock-transfer/:transfer_id", [adminAuthorization, returnStockTransferValidator], ReturnStockTransferRequestFn)
    app.patch("/stock-transfer/close/:transfer_id", [adminAuthorization], CloseTransferRequestFn)
    app.get("/stock-transfer", [adminAuthorization], GetAllTransferRequestFn)
    app.get("/stock-transfer/:transfer_id", [adminAuthorization], GetTransferRequestByIdFn)
}