import { body } from "express-validator";
import { PASSWORD_REGEX, USER_TYPE_LIST, VEHICLE_CATEGORY_LIST, VEHICLE_COLOR_LIST, VEHICLE_SEAT_LIST, VEHICLE_STATUS_LIST } from "../../utils/app-constants";
import { confirmPasswordChain, emailChain, fieldArrayChain, fieldIntegerChain, fieldStringChain, fieldStringMinMaxChain, fieldTypeCheckChain, passwordChain, phoneNumberChain, urlChain } from "../common-validation-rules";


export const registerUserValidationRule = [
  fieldStringMinMaxChain("Name", "name", 1, 60),
  urlChain("Website link", "website"),
  passwordChain,
  confirmPasswordChain,
  phoneNumberChain("phone_number"),
  emailChain("Email", "email"),

];

