import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { contactUs, getCurrency } from "../../services/user/user.service";

export const contactUsFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, contactUs(req), "contactUsFn")
}

export const getCurrencyFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCurrency(), "getCurrencyFn")
}