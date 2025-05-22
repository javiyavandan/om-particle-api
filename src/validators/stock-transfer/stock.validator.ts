import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { addStockTransferRules } from "./stock.rule";

export const addStockTransferValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, addStockTransferRules)
}