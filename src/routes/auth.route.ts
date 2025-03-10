import { Router } from "express";
import {
  changePasswordFn,
  customerListFn,
  forgotPasswordFn,
  loginFn,
  otpVerification,
  registerUserFn,
  resendOtpFn,
  resetPasswordFn,
  testFn,
} from "../controllers/auth.controller";
import {
  changePasswordValidator,
  forgotPasswordValidator,
  loginCustomerValidator,
  registerUserValidator,
  resetPasswordValidator,
  verifyOtpValidator,
} from "../validators/auth/auth.validator";
import { adminAuthorization } from "../middlewares/authenticate";
import { reqMultiImageParser } from "../middlewares/multipart-file-parser";

export default (app: Router) => {
  app.get("/test", testFn);
  app.post("/signup", [reqMultiImageParser(["image", "pdf"]), registerUserValidator], registerUserFn);
  app.post("/signin", [loginCustomerValidator], loginFn);
  app.post("/verifyOtp/:user_id", [verifyOtpValidator], otpVerification);
  app.get("/resendOtp/:user_id", resendOtpFn);
  app.post(
    "/changePassword/:user_id",
    [changePasswordValidator],
    changePasswordFn
  );
  app.post("/forgotPassword", [forgotPasswordValidator], forgotPasswordFn);
  app.post("/resetPassword", [resetPasswordValidator], resetPasswordFn);
  app.get("/admin/customer", [adminAuthorization], customerListFn);
};
