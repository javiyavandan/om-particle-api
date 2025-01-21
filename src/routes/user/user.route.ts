import { Router } from "express";
import { contactUsFn, getCurrencyFn, getUserDetailFn, updateUserDetailFn } from "../../controllers/user/user.controller";
import { contactUsValidator } from "../../validators/user/user.validator";
import { userAuthorization } from "../../middlewares/authenticate";
import { reqMultiImageParser } from "../../middlewares/multipart-file-parser";
import { updateCustomerValidator } from "../../validators/auth/auth.validator";

export default (app: Router) => {
  app.post("/contact-us", [contactUsValidator], contactUsFn);
  app.get("/currency", getCurrencyFn);
  app.get("/", [userAuthorization], getUserDetailFn);
  app.put(
    "/",
    [userAuthorization, reqMultiImageParser(["image", "pdf"]), updateCustomerValidator],
    updateUserDetailFn
  );
}