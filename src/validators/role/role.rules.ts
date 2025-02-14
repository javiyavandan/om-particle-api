import { body, CustomValidator, Meta } from "express-validator";
import {
  BIT_FIELD_VALUES,
  ROLE_NAME_LENGTH_MAX,
  ROLE_NAME_LENGTH_MIN,
} from "../../utils/app-constants";
import {
  ACCESS_ARRAY_VALUE_TYPE_INTEGER,
  ACCESS_ARRAY_VALUE_UNIQUE,
  ACCESS_REQUIRED,
  ACCESS_TYPE_ARRAY,
  ID_MENU_ITEM_REQUIRED,
  ID_MENU_ITEM_TYPE_INTEGER,
  ID_MENU_ITEM_UNIQUE,
  IS_ACTIVE_EXPECTED_TYPE_STRING,
  IS_ACTIVE_REQUIRED,
  ONLY_AI_EXPECTED_TYPE_STRING,
  ROLE_NAME_IS_NON_EMPTY_STRING,
  ROLE_NAME_IS_REQUIRED,
  ROLE_NAME_LENGTH_MIN_MAX,
  ROLE_PERMISSION_ACCESS_REQUIRED,
  ROLE_PERMISSION_ACCESS_TYPE_ARRAY,
} from "../../utils/app-messages";
import { fieldIntegerChain } from "../common-validation-rules";

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

const roleNameChain = (onlyAI: boolean) =>
  body("role_name")
    .if(validateIf(onlyAI))
    .exists()
    .withMessage(ROLE_NAME_IS_REQUIRED)
    .isString()
    .withMessage(ROLE_NAME_IS_NON_EMPTY_STRING)
    .not()
    .isEmpty()
    .withMessage(ROLE_NAME_IS_NON_EMPTY_STRING)
    .isLength({ min: ROLE_NAME_LENGTH_MIN, max: ROLE_NAME_LENGTH_MAX })
    .withMessage(ROLE_NAME_LENGTH_MIN_MAX)
    .trim();

const roleIsActiveChain = body("is_active")
  .exists()
  .withMessage(IS_ACTIVE_REQUIRED)
  .isString()
  .withMessage(IS_ACTIVE_EXPECTED_TYPE_STRING)
  .isIn(BIT_FIELD_VALUES)
  .withMessage(IS_ACTIVE_EXPECTED_TYPE_STRING);

const roleIsOnlyAIChain = body("only_active_inactive")
  .optional()
  .isString()
  .withMessage(ONLY_AI_EXPECTED_TYPE_STRING)
  .isIn(BIT_FIELD_VALUES)
  .withMessage(ONLY_AI_EXPECTED_TYPE_STRING);

const accessValueRule = body("role_permission_access.*.access.*")
  .isInt()
  .withMessage(ACCESS_ARRAY_VALUE_TYPE_INTEGER);

const idMenuItemTypeRule = body("role_permission_access.*.id_menu_item")
  .exists()
  .withMessage(ID_MENU_ITEM_REQUIRED)
  .isInt()
  .withMessage(ID_MENU_ITEM_TYPE_INTEGER);

const rolePermissionAccessChain = [
  body("role_permission_access")
    .exists()
    .withMessage(ROLE_PERMISSION_ACCESS_REQUIRED)
    .isArray()
    .withMessage(ROLE_PERMISSION_ACCESS_TYPE_ARRAY)
    .if(idMenuItemTypeRule)
    .custom((input, { req }) => {
      const list = req.body.role_permission_access.map(
        (item: { id_menu_item: number }) => item.id_menu_item
      );
      for (const [index, value] of Object.entries(list)) {
        if (list.indexOf(value) !== parseInt(index)) {
          return false;
        }
      }
      return true;
    })
    .withMessage(ID_MENU_ITEM_UNIQUE),
  body("role_permission_access.*.access")
    .exists()
    .withMessage(ACCESS_REQUIRED)
    .isArray()
    .withMessage(ACCESS_TYPE_ARRAY)
    .if(accessValueRule)
    .custom((input, _) => {
      for (const [index, value] of Object.entries(input)) {
        if (input.indexOf(value) !== parseInt(index)) {
          return false;
        }
      }
      return true;
    })
    .withMessage(ACCESS_ARRAY_VALUE_UNIQUE),
  idMenuItemTypeRule,
  accessValueRule,
];

export const addRoleValidationRule = [
  roleNameChain(false),
  roleIsOnlyAIChain,
  roleIsActiveChain,
];

export const updateRoleValidationRule = [
  roleNameChain(true),
  roleIsOnlyAIChain,
  roleIsActiveChain,
];

export const addUpdateRoleConfigurationRule = [
  roleNameChain(false),
  ...rolePermissionAccessChain,
];
