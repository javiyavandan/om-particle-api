import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import {
  diamondConciergeRules,
} from "./concierge.rules";

export const diamondConciergeValidator: RequestHandler = async (
  req,
  res,
  next
) => {
  return await modelValidator(req, res, next, diamondConciergeRules);
};
