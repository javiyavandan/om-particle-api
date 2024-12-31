import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addStock } from "../../services/admin/add-product.service";

export const addStockFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addStock(req), "addStockFn");
}