import { Router } from "express";
import { addBlogFn } from "../../controllers/admin/blog.controller";
import { reqSingleImageParser } from "../../middlewares/multipart-file-parser";
import { adminAuthorization } from "../../middlewares/authenticate";

export default (app: Router) => {
    app.post("/blog", [adminAuthorization, reqSingleImageParser("image")], addBlogFn)
}