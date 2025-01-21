import { Router } from "express";
import { createInquiryFn, getInquiryDetailFn, getInquiryListFn, singleProductInquiryFn } from "../../controllers/user/inquiry.controller";
import { customerAuthorization } from "../../middlewares/authenticate";
import { inquiryValidator, singleProductInquiryValidator } from "../../validators/inquiry/inquiry.validator";

export default (app: Router) => {
    app.post('/single-inquiry', [customerAuthorization, singleProductInquiryValidator], singleProductInquiryFn);
    app.post('/inquiry', [customerAuthorization, inquiryValidator], createInquiryFn);
    app.get('/inquiry', [customerAuthorization], getInquiryListFn);
    app.get('/inquiry/:inquiry_number', [customerAuthorization], getInquiryDetailFn);
}