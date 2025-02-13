import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import {
  getAllStaticPages,
  getHomePageData,
  getStaticPageDetail,
} from "../../services/user/home-section.service";

export const getStaticPageListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getAllStaticPages(req), "getStaticPageListFn");
};

export const getStaticPageDetailFn: RequestHandler = (req, res) => {
  callServiceMethod(
    req,
    res,
    getStaticPageDetail(req),
    "getStaticPageDetailFn"
  );
};

export const getHomePageDataFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getHomePageData(), "getHomePageDataFn");
};

