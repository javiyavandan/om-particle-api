import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { blogCategoryRules, blogRules } from "./blog.rules";

export const blogCategoryValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, blogCategoryRules);
};

export const blogValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, blogRules);
}