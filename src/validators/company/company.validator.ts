import { RequestHandler } from "express"
import modelValidator from "../model.validator"
import { companyValidatorRule } from "./company.rules"

export const companyValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, companyValidatorRule)
}