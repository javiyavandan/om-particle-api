import { RequestHandler } from "express"
import modelValidator from "../model.validator"
import { countryValidatorRule } from "./country.rules"

export const countryValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, countryValidatorRule)
}