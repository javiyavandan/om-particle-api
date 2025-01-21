import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { getInquiries, getInquiryDetail, singleProductInquiry, SingleProductInquiryList, updateSingleProductInquiry } from "../../services/admin/inquiry.service";

export const singleProductInquiryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, singleProductInquiry(req), "singleProductInquiryFn");
};

export const singleProductInquiryListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, SingleProductInquiryList(req), "singleProductInquiryListFn");
};

export const updateSingleProductInquiryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateSingleProductInquiry(req), "updateSingleProductInquiryFn");
};

export const inquiryListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getInquiries(req), "inquiryListFn");
};

export const inquiryDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getInquiryDetail(req), "inquiryDetailFn");
};