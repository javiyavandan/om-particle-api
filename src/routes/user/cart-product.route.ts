import { Router } from "express";
import { customerAuthorization } from "../../middlewares/authenticate";
import {
  addCartProductFn,
  cartProductListFn,
  deleteCartProductFn,
  updateQuantityFn,
} from "../../controllers/user/cart-product.controller";
import { addcartProductValidator } from "../../validators/cart-product/cart-product.validatore";

export default (app: Router) => {
  app.post(
    "/cart-product",
    [customerAuthorization, addcartProductValidator],
    addCartProductFn
  );
  app.get("/cart-products", [customerAuthorization], cartProductListFn);
  app.delete(
    "/cart-product/:cart_id",
    [customerAuthorization],
    deleteCartProductFn
  );
  app.patch(
    "/cart-product/:cart_id",
    [customerAuthorization],
    updateQuantityFn
  );
};
