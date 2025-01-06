import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { singleProductInquiryFn, singleProductInquiryListFn, updateSingleProductInquiryFn } from "../../controllers/admin/inquiry.controller";

export default (app: Router) => {
    app.get("/inquiry", [adminAuthorization], singleProductInquiryListFn)
    app.get("/inquiry/:inquiry_id", [adminAuthorization], singleProductInquiryFn)
    app.put("/inquiry/:inquiry_id", [adminAuthorization], updateSingleProductInquiryFn)
}