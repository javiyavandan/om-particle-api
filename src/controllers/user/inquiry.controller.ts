import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addInquiry, getInquiries, getInquiryDetail, singleProductInquiry } from "../../services/user/inquiry.service";

export const singleProductInquiryFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, singleProductInquiry(req), "singleProductInquiryFn");
};

export const createInquiryFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, addInquiry(req), "createInquiryFn");
}

export const getInquiryListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getInquiries(req), "getInquiryListFn");
}

export const getInquiryDetailFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getInquiryDetail(req), "getInquiryDetailFn");
}