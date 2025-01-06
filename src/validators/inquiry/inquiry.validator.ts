import { RequestHandler } from "express"
import modelValidator from "../model.validator"
import { inquiryRules, singleProductInquiryValidatorRule } from "./inquiry.rules"

export const singleProductInquiryValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, singleProductInquiryValidatorRule)
}

export const inquiryValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, inquiryRules)
}