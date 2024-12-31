import { body, CustomValidator, Meta } from "express-validator";
import {
  BUSINESS_USER_NAME_LENGTH_MIN_MAX,
  EMAIL_IS_REQUIRED,
  EMAIL_LENGTH_MIN_MAX,
  ID_ROLE_INVALID_TYPE,
  ID_ROLE_IS_REQUIRED,
  INVALID_EMAIL,
  NAME_IS_NON_EMPTY_STRING,
  NAME_IS_REQUIRED,
  PHONE_NUMBER_IS_NON_EMPTY_STRING,
  PHONE_NUMBER_IS_REQUIRED,
  PHONE_NUMBER_LENGTH_MIN_MAX,
} from "../../utils/app-messages";
import {
  BUSINESS_USER_NAME_LENGTH_MAX,
  BUSINESS_USER_NAME_LENGTH_MIN,
  EMAIL_LENGTH_MAX,
  EMAIL_LENGTH_MIN,
  PHONE_NUMBER_LENGTH_MAX,
  PHONE_NUMBER_LENGTH_MIN,
} from "../../utils/app-constants";
import {
  confirmPasswordChain,
  isActiveChain,
  isOnlyAIChain,
  passwordChain,
} from "../../validators/common-validation-rules";

const checkOnlyAI = (onlyAI: boolean, req: Meta["req"]) => {
  if (onlyAI) {
    return !Object.keys(req.body).includes("only_active_inactive");
  }
  return true;
};

const validateIf =
  (onlyAI: boolean): CustomValidator =>
  (input, { req }) =>
    checkOnlyAI(onlyAI, req);

const nameChain = (onlyAI: boolean) =>
  body("name")
    .if(validateIf(onlyAI))
    .exists()
    .withMessage(NAME_IS_REQUIRED)
    .isString()
    .withMessage(NAME_IS_NON_EMPTY_STRING)
    .not()
    .isEmpty()
    .withMessage(NAME_IS_NON_EMPTY_STRING)
    .isLength({
      min: BUSINESS_USER_NAME_LENGTH_MIN,
      max: BUSINESS_USER_NAME_LENGTH_MAX,
    })
    .withMessage(BUSINESS_USER_NAME_LENGTH_MIN_MAX)
    .trim();

const emailChain = body("email")
  .exists()
  .withMessage(EMAIL_IS_REQUIRED)
  .isEmail()
  .withMessage(INVALID_EMAIL)
  .isLength({
    min: EMAIL_LENGTH_MIN,
    max: EMAIL_LENGTH_MAX,
  })
  .withMessage(EMAIL_LENGTH_MIN_MAX)
  .trim();

const phoneNumberChain = (onlyAI: boolean) =>
  body("phone_number")
    .if(validateIf(onlyAI))
    .exists()
    .withMessage(PHONE_NUMBER_IS_REQUIRED)
    .isString()
    .withMessage(PHONE_NUMBER_IS_NON_EMPTY_STRING)
    .not()
    .isEmpty()
    .withMessage(PHONE_NUMBER_IS_NON_EMPTY_STRING)
    .isLength({
      min: PHONE_NUMBER_LENGTH_MIN,
      max: PHONE_NUMBER_LENGTH_MAX,
    })
    .withMessage(PHONE_NUMBER_LENGTH_MIN_MAX)
    .trim();

const idRoleChain = (onlyAI: boolean) =>
  body("id_role")
    .if(validateIf(onlyAI))
    .exists()
    .withMessage(ID_ROLE_IS_REQUIRED)
    .isInt()
    .withMessage(ID_ROLE_INVALID_TYPE);

export const addBusinessUserValidationRule = [
  nameChain(false),
  phoneNumberChain(false),
  idRoleChain(false),
  isOnlyAIChain,
  isActiveChain,
  emailChain,
  passwordChain,
  confirmPasswordChain,
];

export const updateBusinessUserValidationRule = [
  nameChain(true),
  phoneNumberChain(true),
  idRoleChain(true),
  isOnlyAIChain,
  isActiveChain,
];

// export const addBusinessUserValidationRule = [
//   nameChain(false),
//   phoneNumberChain(false),
//   idRoleChain(false),
//   isOnlyAIChain,
//   isActiveChain,
//   emailChain,
//   passwordChain,
//   confirmPasswordChain,
// ];

// export const updateBusinessUserValidationRule = [
//   nameChain(true),
//   phoneNumberChain(true),
//   idRoleChain(true),
//   isOnlyAIChain,
//   isActiveChain,
// ];
