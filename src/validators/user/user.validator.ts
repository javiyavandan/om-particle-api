import { RequestHandler } from "express"
import modelValidator from "../model.validator"
import { contactUsRules } from "./user.rules"

export const contactUsValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, contactUsRules)
}