import { Router } from "express";
import { filterDataListFn } from "../../controllers/filter-dropdown.controller";

export default (app: Router) => {
    app.get("/filter-list", filterDataListFn)
}