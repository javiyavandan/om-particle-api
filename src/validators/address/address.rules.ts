import { body } from "express-validator";
import { fieldStringChain, phoneNumberChain } from "../common-validation-rules";
import { prepareMessageFromParams } from "../../utils/shared-functions";
import {
  INVALID_ERROR_MESSAGE,
  REQUIRED_ERROR_MESSAGE,
} from "../../utils/app-messages";

export const addAddressRules = [
  fieldStringChain("First Name", "first_name"),
  fieldStringChain("Last Name", "last_name"),
  phoneNumberChain("phone_number"),
  fieldStringChain("address", "address"),
  fieldStringChain("city", "city"),
  fieldStringChain("State", "state"),
  fieldStringChain("Country", "country"),
  fieldStringChain("Postcode", "postcode"),
];

export const updateAddressRules = [
  ...addAddressRules,
  body("is_default")
    .exists()
    .withMessage(
      prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
        ["field_name", "is_default"],
      ])
    )
    .isBoolean()
    .withMessage(
      prepareMessageFromParams(INVALID_ERROR_MESSAGE, [
        ["field_name", "is_default"],
      ])
    ),
];
