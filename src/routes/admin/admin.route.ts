import { Router } from "express";
import {
  contactUsListFn,
  // dashboardFn,
  getAllUser,
  updateUserStatusFn,
  userDetailFn,
  userVerifyFn,
} from "../../controllers/admin/admin.controller";
import { adminAuthorization } from "../../middlewares/authenticate";

export default (app: Router) => {
  app.get("/users", [adminAuthorization], getAllUser);
  app.get("/user/:id", [adminAuthorization], userDetailFn);
  app.patch("/user-verified/:user_id", [adminAuthorization], userVerifyFn);
  app.patch("/user-status/:user_id", [adminAuthorization], updateUserStatusFn);
  // app.get("/dashboard", [adminAuthorization], dashboardFn);
  app.get("/contact-us", [adminAuthorization], contactUsListFn);
};
