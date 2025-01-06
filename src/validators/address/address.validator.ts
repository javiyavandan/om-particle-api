import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { addAddressRules, updateAddressRules } from "./address.rules";

export const addAddressValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, addAddressRules);
};

export const updateAddressValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, updateAddressRules);
};
