import { RequestHandler } from "express";
import {
  addCartProduct,
  cartProductList,
  deleteCartProduct,
  updateQuantity,
} from "../../services/user/cart-product.service";
import { callServiceMethod } from "../base.controller";

export const addCartProductFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, addCartProduct(req), "addCartProductFn");
};

export const cartProductListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, cartProductList(req), "cartProductListFn");
};

export const deleteCartProductFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, deleteCartProduct(req), "deleteCartProductFn");
};

export const updateQuantityFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, updateQuantity(req), "updateQuantityFn");
};
