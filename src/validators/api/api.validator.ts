import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { createApiRules, updateApiRules } from "./api.rules";

export const createApiValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, createApiRules);
};

export const updateApiValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, updateApiRules);
};
