import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import {

  registerUserValidationRule,
} from "./auth.rules";

export const registerUserValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, registerUserValidationRule);
};

