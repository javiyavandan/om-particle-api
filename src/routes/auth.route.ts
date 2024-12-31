import { Router } from "express";
import {
  changePasswordFn,
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
  registerCustomerValidator,
  resetPasswordValidator,
  verifyOtpValidator,
} from "../validators/auth/auth.validator";

export default (app: Router) => {
  app.use("/test", testFn);
  app.post("/signup", [registerCustomerValidator], registerUserFn);
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
};
