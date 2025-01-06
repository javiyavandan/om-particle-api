import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { folderRules, wishlistRules } from "./wishlist.rules";

export const wishlistValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, wishlistRules);
};
export const folderValidator: RequestHandler = async (req, res, next) => {
  return await modelValidator(req, res, next, folderRules);
};
