import { RequestHandler } from "express"
import modelValidator from "../model.validator"
import { currencyValidatorRule } from "./currency.rules"

export const currencyValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, currencyValidatorRule)
}