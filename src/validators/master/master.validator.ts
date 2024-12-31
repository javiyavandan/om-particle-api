import { RequestHandler } from "express";
import { masterValidatorRule } from "./master.rules";
import modelValidator from "../model.validator";

export const masterValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, masterValidatorRule)
}