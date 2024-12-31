import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import {
  addRoleValidationRule,
  addUpdateRoleConfigurationRule,
  updateRoleValidationRule,
} from "./role.rules";

export const addRoleValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, addRoleValidationRule);
};

export const updateRoleValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, updateRoleValidationRule);
};

export const addUpdateRoleConfigurationValidator: RequestHandler = async (
  req,
  res,
  next
) => {
  return await modelValidator(req, res, next, addUpdateRoleConfigurationRule);
};
