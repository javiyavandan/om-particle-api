import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addStaticPage, deleteStaticPage, staticPageDetail, staticPageList, staticPageStatusUpdate, updateStaticPage } from "../../services/admin/static-page.service";

export const addStaticPageFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, addStaticPage(req), "addStaticPageFn");
};
export const updateStaticPageFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, updateStaticPage(req), "updateStaticPageFn");
};
export const staticPageListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, staticPageList(req), "staticPageListFn");
};
export const staticPageDetailFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, staticPageDetail(req), "staticPageDetailFn");
};
export const staticPageStatusUpdateFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, staticPageStatusUpdate(req), "staticPageStatusUpdateFn");
};
export const staticPageDeleteFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, deleteStaticPage(req), "staticPageDeleteFn");
};