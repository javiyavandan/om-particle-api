import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { getWishlist, getWishlistDetails } from "../../services/admin/wishlist-product.service";

export const getWishlistFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getWishlist(req), "getWishlistFn");
};

export const getWishlistDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getWishlistDetails(req), "getWishlistDetailFn");
  };
  