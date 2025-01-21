import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import {
  getWishlistDetailFn,
  getWishlistFn,
} from "../../controllers/admin/wishlist-admin.controller";

export default (app: Router) => {
  app.get("/wishlist", [adminAuthorization], getWishlistFn);
  app.get("/wishlist/:wishlist_id", [adminAuthorization], getWishlistDetailFn);
};
