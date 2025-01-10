import { Router } from "express";
import filterDropdownRoute from "./filter-dropdown.route";
import conciergeRoute from "./concierge.route";
import wishlistRoute from "./wishlist.route";
import cartProductRoute from "./cart-product.route";
import inquiryRoute from "./inquiry.route";
import addressRoute from "./address.route";
import stockRoute from "./stock.route";
import userRoute from "./user.route";

export default () => {
  const app = Router();
  filterDropdownRoute(app);
  conciergeRoute(app);
  wishlistRoute(app);
  cartProductRoute(app);
  inquiryRoute(app);
  addressRoute(app);
  stockRoute(app);
  userRoute(app);
  return app;
};
