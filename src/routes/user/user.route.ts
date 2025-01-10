import { Router } from "express";
import { contactUsFn, getCurrencyFn } from "../../controllers/user/user.controller";
import { contactUsValidator } from "../../validators/user/user.validator";

export default (app: Router) => {
  app.post("/contact-us", [contactUsValidator], contactUsFn);
  app.get("/currency", getCurrencyFn);
}