import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { memoRules } from "./memo.rule";

export const memoValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, memoRules)
}