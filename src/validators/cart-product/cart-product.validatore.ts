import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { addcartProductRule } from "./cart-product.rules";

export const addcartProductValidator: RequestHandler = async (
  req,
  res,
  next
) => {
  return await modelValidator(req, res, next, addcartProductRule);
};
