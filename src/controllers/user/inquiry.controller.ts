import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { singleProductInquiry } from "../../services/user/inquiry.service";

export const singleProductInquiryFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, singleProductInquiry(req), "singleProductInquiryFn");
};