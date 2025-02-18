import { Router } from "express";
import {
  getHomePageDataFn,
  getStaticPageDetailFn,
  getStaticPageListFn,
} from "../../controllers/user/home-section.controller";

export default (app: Router) => {
  app.get("/static-pages", getStaticPageListFn);
  app.get("/static-page/:slug", getStaticPageDetailFn);
  app.get("/home-page", getHomePageDataFn)
};
