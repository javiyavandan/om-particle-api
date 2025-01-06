import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { getAllCartList, getCartDetail } from "../../services/admin/cart-product-admin.service";

export const getCartListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getAllCartList(req), "getCartListFn");
};

export const getCartDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCartDetail(req), "getCartDetailFn");
  };
  