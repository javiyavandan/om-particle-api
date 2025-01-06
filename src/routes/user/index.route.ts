import { Router } from "express";
import filterDropdownRoute from "./filter-dropdown.route";
import conciergeRoute from "./concierge.route";
import wishlistRoute from "./wishlist.route";

export default () => {
  const app = Router();
  filterDropdownRoute(app);
  conciergeRoute(app);
  wishlistRoute(app);
  return app;
};
