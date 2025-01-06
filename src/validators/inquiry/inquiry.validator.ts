import { RequestHandler } from "express"
import modelValidator from "../model.validator"
import { singleProductInquiryValidatorRule } from "./inquiry.rules"

export const singleProductInquiryValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, singleProductInquiryValidatorRule)
}