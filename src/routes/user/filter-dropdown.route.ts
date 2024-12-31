import { Router } from "express";
import { filterDataListFn } from "../../controllers/filter-dropdown.controller";
import { customerAuthorization } from "../../middlewares/authenticate";

export default (app: Router) => {
    app.get("/filter-list", [customerAuthorization], filterDataListFn)
}