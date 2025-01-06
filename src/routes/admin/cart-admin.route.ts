import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import {
  getCartDetailFn,
  getCartListFn,
} from "../../controllers/admin/cart-admin.controller";

export default (app: Router) => {
  app.get("/cart", [adminAuthorization], getCartListFn);
  app.get("/cart/:cart_id", [adminAuthorization], getCartDetailFn);
};
