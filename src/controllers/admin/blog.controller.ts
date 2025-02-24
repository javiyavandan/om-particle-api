import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addBlog } from "../../services/admin/blogs.service";

export const addBlogFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addBlog(req), "addBlogFn");
};