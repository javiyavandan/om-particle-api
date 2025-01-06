import { RequestHandler } from "express";
import { callServiceMethod } from "./base.controller";
import {
  createShareProduct,
  shareProduct,
} from "../services/user/share-product.service";

export const createShareProductFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, createShareProduct(req), "createShareProductFn");
};
export const shareProductFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, shareProduct(req), "shareProductFn");
};