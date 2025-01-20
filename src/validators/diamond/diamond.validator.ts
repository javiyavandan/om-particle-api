import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { comparedDiamondsRules } from "./diamond.rules";

export const comparedDiamondsValidator: RequestHandler = async (
  req,
  res,
  next
) => {
  return await modelValidator(req, res, next, comparedDiamondsRules);
};
