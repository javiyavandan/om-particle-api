import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addSection, deleteSection, getHomePageData, getHomePageDataById, updateSection, updateStatus } from "../../services/admin/home-page.service";

export const addSectionFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addSection(req), "addSectionFn");
};

export const updateSectionFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateSection(req), "updateSectionFn");
};

export const deleteSectionFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteSection(req), "deleteSectionFn");
};

export const getSectionFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getHomePageDataById(req), "getSectionFn");
};

export const getSectionListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getHomePageData(req), "getSectionListFn");
};

export const updateSectionStatusFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateStatus(req), "updateSectionStatusFn");
};