import { RequestHandler } from "express";
import {
  changePassword,
  forgotPassword,
  resendOtp,
  resetPassword,
  login,
  registerUser,
  test,
  verifyOtp,
} from "../services/auth.service";
import { callServiceMethod } from "./base.controller";

export const testFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, test(req), "registerSystemUserFn");
};

export const registerUserFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, registerUser(req, res), "registerUserFn");
};

export const loginFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, login(req, res), "loginFn");
};

export const otpVerification: RequestHandler = (req, res) => {
  callServiceMethod(req, res, verifyOtp(req, res), "verifyOtp");
};

export const resendOtpFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, resendOtp(req), "resendOtpFn");
};

export const changePasswordFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, changePassword(req, res), "changePasswordFn");
};

export const forgotPasswordFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, forgotPassword(req), "forgotPasswordFn");
};

export const resetPasswordFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, resetPassword(req), "resetPasswordFn");
};
