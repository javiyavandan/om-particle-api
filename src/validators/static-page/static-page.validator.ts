import { RequestHandler } from "express"
import modelValidator from "../model.validator"
import { staticPageValidatorRule } from "./static-page.rules"

export const staticPageValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, staticPageValidatorRule)
}