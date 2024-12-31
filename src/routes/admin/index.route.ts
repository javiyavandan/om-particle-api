import { Router } from "express";
import masterRoute from "./master.route";
import adminRoute from "./admin.route";

export default function adminRouter() {
  const app = Router();
  masterRoute(app);
  adminRoute(app);
  return app;
}
