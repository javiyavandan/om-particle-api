import { Router } from "express";
import {
  testFn,
} from "../controllers/auth.controller";

export default (app: Router) => {
  app.use("/test", testFn);

};
