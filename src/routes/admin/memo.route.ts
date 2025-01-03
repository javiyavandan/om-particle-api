import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { createMemoFn, getAllMemoFn, getMemoFn, returnMemoStockFn } from "../../controllers/admin/memo.controller";
import { memoValidator } from "../../validators/memo/memo.validator";

export default (app: Router) => {
    app.post("/memo", [adminAuthorization, memoValidator], createMemoFn)
    app.get("/memo/:memo_id", [adminAuthorization], getMemoFn)
    app.get("/memo", [adminAuthorization], getAllMemoFn)
    app.put("/memo", [adminAuthorization], returnMemoStockFn)
}