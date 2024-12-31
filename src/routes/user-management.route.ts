import { Router } from "express";

import { reqSingleImageParser } from "../middlewares/multipart-file-parser";

import {
  addBusinessUserFn,
  deleteBusinessUserFn,
  getAllBusinessUsersFn,
  getBusinessUserByIdFn,
  updateBusinessUserFn,
} from "../controllers/user-management.controller";
import { adminAuthorization } from "../middlewares/authenticate";
import {
  addBusinessUserValidator,
  updateBusinessUserValidator,
} from "./user-management/user-management.validator";

export default (app: Router) => {
  app.get("/business-user", [adminAuthorization], getAllBusinessUsersFn);
  app.get("/business-user/:id", [adminAuthorization], getBusinessUserByIdFn);

  app.post(
    "/business-user",
    [
      adminAuthorization,
      reqSingleImageParser("image"),
      addBusinessUserValidator,
    ],
    addBusinessUserFn
  );
  app.put(
    "/business-user/:id",
    [
      adminAuthorization,
      reqSingleImageParser("image"),
      updateBusinessUserValidator,
    ],
    updateBusinessUserFn
  );
  app.delete("/business-user/:id", [adminAuthorization], deleteBusinessUserFn);
};
