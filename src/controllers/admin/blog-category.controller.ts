import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addCategory, deleteCategory, getCategoryDetails, getCategoryList, updateCategory, updateCategoryStatus } from "../../services/admin/blog-category.service";

export const addCategoryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addCategory(req), "addCategoryFn")
}

export const updateCategoryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateCategory(req), "updateCategoryFn")
}

export const deleteCategoryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteCategory(req), "deleteCategoryFn")
}

export const updateCategoryStatusFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateCategoryStatus(req), "updateCategoryStatusFn")
}

export const getCategoryListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCategoryList(req), "getCategoryListFn")
}

export const getCategoryDetailsFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCategoryDetails(req), "getCategoryDetailsFn")
}