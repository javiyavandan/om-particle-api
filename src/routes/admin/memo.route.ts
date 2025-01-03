import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { createMemoFn, getAllMemoFn, getMemoFn, returnMemoStockFn } from "../../controllers/admin/memo.controller";

export default (app: Router) => {
    app.post("/memo", [adminAuthorization], createMemoFn)
    app.get("/memo/:memo_id", [adminAuthorization], getMemoFn)
    app.get("/memo", [adminAuthorization], getAllMemoFn)
    app.put("/memo", [adminAuthorization], returnMemoStockFn)
}