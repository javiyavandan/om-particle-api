import { body } from "express-validator";
import { PASSWORD_REGEX } from "../../utils/app-constants";
import {
  confirmPasswordChain,
  emailChain,
  fieldStringChain,
  fieldStringNotReqChain,
  passwordChain,
} from "../common-validation-rules";
import {
  INVALID_PASSWORD,
  PASSWORD_IS_REQUIRED,
  PASSWORD_TYPE_NON_EMPTY_STRING,
  AUTHORIZATION_TOKEN_IS_REQUIRED,
} from "../../utils/app-messages";

export const registerUserValidationRule = [
  fieldStringChain("First Name", "first_name"),
  fieldStringNotReqChain("Last Name", "last_name"),
  emailChain("Email", "email"),
  passwordChain,
  confirmPasswordChain,
  fieldStringNotReqChain("registration_number", "registration_number"),
];

export const updateCustomerValidatorRules = [
  fieldStringChain("first name", "first_name"),
  fieldStringNotReqChain("last name", "last_name"),
  fieldStringNotReqChain("company name", "company_name"),
  fieldStringNotReqChain("address", "address"),
  fieldStringNotReqChain("city", "city"),
  fieldStringNotReqChain("state", "state"),
  fieldStringNotReqChain("country", "country"),
  fieldStringNotReqChain("postcode", "postcode"),
  fieldStringNotReqChain("registration_number", "registration_number"),
];

export const signinValidatorRules = [
  emailChain("email", "email"),
  passwordChain,
];

export const otpVerifyValidatorRules = [fieldStringChain("OTP", "otp")];

export const changePasswordValidatorRules = [
  body("oldPassword")
    .exists()
    .withMessage(PASSWORD_IS_REQUIRED)
    .isString()
    .withMessage(PASSWORD_TYPE_NON_EMPTY_STRING)
    .not()
    .isEmpty()
    .withMessage(PASSWORD_TYPE_NON_EMPTY_STRING)
    .matches(PASSWORD_REGEX)
    .withMessage(INVALID_PASSWORD),
  body("newPassword")
    .exists()
    .withMessage(PASSWORD_IS_REQUIRED)
    .isString()
    .withMessage(PASSWORD_TYPE_NON_EMPTY_STRING)
    .not()
    .isEmpty()
    .withMessage(PASSWORD_TYPE_NON_EMPTY_STRING)
    .matches(PASSWORD_REGEX)
    .withMessage(INVALID_PASSWORD),
];

export const forgotPasswordValidatorRules = [emailChain("email", "email")];

export const resetPasswordValidatorRules = [
  body("newPassword")
    .exists()
    .withMessage(PASSWORD_IS_REQUIRED)
    .isString()
    .withMessage(PASSWORD_TYPE_NON_EMPTY_STRING)
    .not()
    .isEmpty()
    .withMessage(PASSWORD_TYPE_NON_EMPTY_STRING)
    .matches(PASSWORD_REGEX)
    .withMessage(INVALID_PASSWORD),
  body("token")
    .exists()
    .withMessage(AUTHORIZATION_TOKEN_IS_REQUIRED)
    .not()
    .isEmpty()
    .withMessage(AUTHORIZATION_TOKEN_IS_REQUIRED),
];

export const updateUserAdminRules = [
  fieldStringChain("first name", "first_name"),
  fieldStringNotReqChain("last name", "last_name"),
  fieldStringNotReqChain("company name", "company_name"),
  fieldStringNotReqChain("address", "address"),
  fieldStringNotReqChain("city", "city"),
  fieldStringNotReqChain("state", "state"),
  fieldStringNotReqChain("country", "country"),
  fieldStringNotReqChain("postcode", "postcode"),
  fieldStringNotReqChain("registration_number", "registration_number"),
];