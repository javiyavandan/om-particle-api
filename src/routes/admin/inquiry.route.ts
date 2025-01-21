import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { inquiryDetailFn, inquiryListFn, singleProductInquiryFn, singleProductInquiryListFn, updateSingleProductInquiryFn } from "../../controllers/admin/inquiry.controller";

export default (app: Router) => {
    app.get("/single-inquiry", [adminAuthorization], singleProductInquiryListFn)
    app.get("/single-inquiry/:inquiry_id", [adminAuthorization], singleProductInquiryFn)
    app.put("/single-inquiry/:inquiry_id", [adminAuthorization], updateSingleProductInquiryFn)
    app.get("/inquiry", [adminAuthorization], inquiryListFn)
    app.get("/inquiry/:inquiry_id", [adminAuthorization], inquiryDetailFn)
}