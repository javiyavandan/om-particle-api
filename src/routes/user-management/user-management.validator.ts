import { RequestHandler } from "express";
import {
  addBusinessUserValidationRule,
  updateBusinessUserValidationRule,
} from "./user-management.rules";
import modelValidator from "../../validators/model.validator";

export const addBusinessUserValidator: RequestHandler = async (
  req,
  res,
  next
) => {
  return await modelValidator(req, res, next, addBusinessUserValidationRule);
};

export const updateBusinessUserValidator: RequestHandler = async (
  req,
  res,
  next
) => {
  return await modelValidator(req, res, next, updateBusinessUserValidationRule);
};
