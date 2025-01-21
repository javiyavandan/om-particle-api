import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { invoiceRules } from "./invoice.rule";

export const invoiceValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, invoiceRules)
}