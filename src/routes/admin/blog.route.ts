import { Router } from "express";
import { addBlogFn, blogDetailsFn, blogListFn, deleteBlogFn, updateBlogFn, updateBlogStatusFn } from "../../controllers/admin/blog.controller";
import { adminAuthorization } from "../../middlewares/authenticate";
import { reqMultiImageParser } from "../../middlewares/multipart-file-parser";
import { blogValidator } from "../../validators/blog/blog.validator";

export default (app: Router) => {
    app.post("/blog", [adminAuthorization, reqMultiImageParser(["image", "banner"]), blogValidator], addBlogFn)
    app.put("/blog/:blog_id", [adminAuthorization, reqMultiImageParser(["image", "banner"]), blogValidator], updateBlogFn)
    app.patch("/blog/:blog_id", [adminAuthorization], updateBlogStatusFn)
    app.delete("/blog/:blog_id", [adminAuthorization], deleteBlogFn)
    app.get("/blog", [adminAuthorization], blogListFn)
    app.get("/blog/:blog_id", [adminAuthorization], blogDetailsFn)
}