import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { createFolder, deleteWishlist, folderList, wishlist, wishlistProduct } from "../../services/user/wishlist-product.service";

export const wishlistAddFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, wishlistProduct(req), "wishlistAddFn");
};
export const wishlistDeleteFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, deleteWishlist(req), "wishlistDeleteFn");
};
export const wishlistFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, wishlist(req), "wishlistFn");
};
export const createFolderFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, createFolder(req), "createFolderFn")
}
export const folderListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, folderList(req), "folderListFn")
}
