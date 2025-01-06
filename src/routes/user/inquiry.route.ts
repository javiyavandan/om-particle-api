import { Router } from "express";
import { singleProductInquiryFn } from "../../controllers/user/inquiry.controller";
import { customerAuthorization } from "../../middlewares/authenticate";
import { singleProductInquiryValidator } from "../../validators/inquiry/inquiry.validator";

export default (app: Router) => {
    app.post('/inquiry', [customerAuthorization, singleProductInquiryValidator], singleProductInquiryFn);
}