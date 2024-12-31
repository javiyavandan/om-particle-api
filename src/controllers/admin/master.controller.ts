import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addMaster, updateMaster, masterList, masterDetail, masterStatusUpdate, masterDelete } from "../../services/admin/master.service";
import { getParentCategory, getSubCategory } from "../../services/admin/category-master.service";
import { getPreferenceParentCategory } from "../../services/admin/preference.service";

// ::::::::::---------:::::=== master Master Controller ===:::::---------:::::::::: //
export const addMasterFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, addMaster(req), "addMasterFn");
};
export const updateMasterFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, updateMaster(req), "updateMasterFn");
};
export const masterListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, masterList(req), "masterListFn");
};
export const masterDetailFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, masterDetail(req), "masterDetailFn");
};
export const masterStatusUpdateFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, masterStatusUpdate(req), "masterStatusUpdateFn");
};
export const masterDeleteFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, masterDelete(req), "masterDeleteFn");
};
export const categoryListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getParentCategory(req), "categoryListFn");
};
export const subCategoryListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getSubCategory(req), "subCategoryListFn");
};
export const preferenceListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, getPreferenceParentCategory(req), "PreferenceListFn");
};