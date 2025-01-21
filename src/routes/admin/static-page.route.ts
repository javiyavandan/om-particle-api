import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { addStaticPageFn, staticPageDeleteFn, staticPageDetailFn, staticPageListFn, staticPageStatusUpdateFn, updateStaticPageFn } from "../../controllers/admin/static-page.controller";
import { staticPageValidator } from "../../validators/static-page/static-page.validator";

export default (app: Router) => {

  app.post("/static-page", [adminAuthorization, staticPageValidator], addStaticPageFn);
  app.put("/static-page/:page_id", [adminAuthorization, staticPageValidator], updateStaticPageFn)
  app.get("/static-pages", [adminAuthorization], staticPageListFn)
  app.get("/static-page/:page_id", [adminAuthorization], staticPageDetailFn)
  app.patch("/static-page/:page_id", [adminAuthorization], staticPageStatusUpdateFn)
  app.delete("/static-page/:page_id", [adminAuthorization], staticPageDeleteFn)

};
