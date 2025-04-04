import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import {
  registerUserValidationRule,
  signinValidatorRules,
  otpVerifyValidatorRules,
  changePasswordValidatorRules,
  forgotPasswordValidatorRules,
  resetPasswordValidatorRules,
  updateCustomerValidatorRules,
  updateUserAdminRules,
} from "./auth.rules";

export const registerUserValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, registerUserValidationRule);
};

export const loginCustomerValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, signinValidatorRules);
}

export const verifyOtpValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, otpVerifyValidatorRules);
}

export const changePasswordValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, changePasswordValidatorRules);
}

export const forgotPasswordValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, forgotPasswordValidatorRules);
}

export const resetPasswordValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, resetPasswordValidatorRules);
}


export const updateCustomerValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, updateCustomerValidatorRules);
}

export const updateCustomerFromAdminValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, updateUserAdminRules);
}
