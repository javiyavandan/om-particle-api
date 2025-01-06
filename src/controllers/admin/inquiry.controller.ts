import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { singleProductInquiry, SingleProductInquiryList, updateSingleProductInquiry } from "../../services/admin/inquiry.service";

export const singleProductInquiryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, singleProductInquiry(req), "singleProductInquiryFn");
};

export const singleProductInquiryListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, SingleProductInquiryList(req), "singleProductInquiryListFn");
};

export const updateSingleProductInquiryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateSingleProductInquiry(req), "updateSingleProductInquiryFn");
};