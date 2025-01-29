import { Router } from "express";
import { customerAuthorization } from "../../middlewares/authenticate";
import { compareDiamondsFn } from "../../controllers/user/compare-diamonds.controller";
import { comparedDiamondsValidator } from "../../validators/diamond/diamond.validator";

export default (app: Router) => {
    app.post(
        "/compared-diamonds",
        [comparedDiamondsValidator],
        compareDiamondsFn
    );

}