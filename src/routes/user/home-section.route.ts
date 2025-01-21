import { Router } from "express";
import {
  getStaticPageDetailFn,
  getStaticPageListFn,
} from "../../controllers/user/home-section.controller";

export default (app: Router) => {
  app.get("/static-pages", getStaticPageListFn);
  app.get("/static-page/:slug", getStaticPageDetailFn);
};
