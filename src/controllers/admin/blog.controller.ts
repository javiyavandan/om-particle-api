import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addBlog, blogDetails, blogList, deleteBlog, updateBlog, updateBlogStatus } from "../../services/admin/blogs.service";

export const addBlogFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addBlog(req), "addBlogFn");
};

export const updateBlogFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateBlog(req), "updateBlogFn");
}

export const deleteBlogFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteBlog(req), "deleteBlogFn");
}

export const updateBlogStatusFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateBlogStatus(req), "updateBlogStatusFn");
}

export const blogListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, blogList(req), "blogListFn");
}

export const blogDetailsFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, blogDetails(req), "blogDetailsFn");
}