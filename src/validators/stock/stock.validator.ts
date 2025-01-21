import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { addStockRules } from "./stock.rule";

export const addStockValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, addStockRules)
}