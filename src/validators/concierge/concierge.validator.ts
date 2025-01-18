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
  console.log(req.body)
  return await modelValidator(req, res, next, diamondConciergeRules);
};
