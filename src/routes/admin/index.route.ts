import { Router } from "express";
import masterRoute from "./master.route";

export default function adminRouter() {
  const app = Router();
  masterRoute(app);
  return app;
}
