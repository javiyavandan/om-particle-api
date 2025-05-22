import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { addStockTransferRules, returnStockTransferRules } from "./stock-transfer.rule";

export const addStockTransferValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, addStockTransferRules)
}

export const returnStockTransferValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, returnStockTransferRules)
}