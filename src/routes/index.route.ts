import { Router } from "express";
import authRoute from "./auth.route";
import uploadRoute from "./upload.route";
import roleRoute from "./role.route";
import userManagementRoute from "./user-management.route";
import shareProductRoute from "./share-product.route";

export default () => {
  const app = Router();
  authRoute(app);
  uploadRoute(app);
  roleRoute(app);
  userManagementRoute(app);
  shareProductRoute(app);
  return app;
};
