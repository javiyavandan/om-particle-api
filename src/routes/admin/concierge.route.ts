import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { getDiamondConciergeListFn, getDiamondConciergeDetailFn } from "../../controllers/admin/concierge.controller";

export default (app: Router) => {
  app.get(
    "/diamond-concierge",
    [adminAuthorization],
    getDiamondConciergeListFn
  );
  app.get(
    "/diamond-concierge/:concierge_id",
    [adminAuthorization],
    getDiamondConciergeDetailFn
  );
};
