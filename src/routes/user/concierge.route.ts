import { Router } from "express";
import { addDiamondConciergeFn } from "../../controllers/user/concierge.controller";
import { diamondConciergeValidator } from "../../validators/concierge/concierge.validator";
import { customerAuthorization } from "../../middlewares/authenticate";
import { reqSingleImageParser } from "../../middlewares/multipart-file-parser";

export default (app: Router) => {
  app.post("/diamond-concierge", [reqSingleImageParser("image"), diamondConciergeValidator], addDiamondConciergeFn);
};
