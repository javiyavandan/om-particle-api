import { Router } from "express";
import { addDiamondConciergeFn } from "../../controllers/user/concierge.controller";
import { diamondConciergeValidator } from "../../validators/concierge/concierge.validator";
import { customerAuthorization } from "../../middlewares/authenticate";

export default (app: Router) => {
  app.post("/diamond-concierge", [customerAuthorization, diamondConciergeValidator], addDiamondConciergeFn);
};
