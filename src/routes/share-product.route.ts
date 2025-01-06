import { Router } from "express";
import { customerAuthorization } from "../middlewares/authenticate";
import {
  createShareProductFn,
  shareProductFn,
} from "../controllers/share-products.controller";

export default (app: Router) => {
  app.post("/user/share-products", [customerAuthorization], createShareProductFn);
  app.get("/user/share-product/:share_id", shareProductFn);
  };
