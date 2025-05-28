import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { createApiFn, deleteApiFn, getApiDetailsFn, getApiListFn, updateApiFn, updateStatusFn } from "../../controllers/admin/apis.controller";
import { createApiValidator, updateApiValidator } from "../../validators/api/api.validator";

export default (app: Router) => {
    app.post("/api", [adminAuthorization, createApiValidator], createApiFn)
    app.put("/api/:api_id", [adminAuthorization, updateApiValidator], updateApiFn)
    app.patch("/api/:api_id", [adminAuthorization], updateStatusFn)
    app.delete("/api/:api_id", [adminAuthorization], deleteApiFn)
    app.get("/api", [adminAuthorization], getApiListFn)
    app.get("/api/:api_id", [adminAuthorization], getApiDetailsFn)
}