import { Router } from "express";
import filterDropdownRoute from "./filter-dropdown.route";
import conciergeRoute from "./concierge.route";

export default () => {
  const app = Router();
  filterDropdownRoute(app);
  conciergeRoute(app);
  return app;
};
