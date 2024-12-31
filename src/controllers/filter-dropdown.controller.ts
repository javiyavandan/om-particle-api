import { RequestHandler } from "express";
import { callServiceMethod } from "./base.controller";
import { getAllFilterData } from "../services/filter-dropdown.service";

export const filterDataListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getAllFilterData(req), "filterDataListFn")
}