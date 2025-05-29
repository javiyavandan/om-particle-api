import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { blogCategoryValidator } from "../../validators/blog/blog.validator";
import { addCategoryFn, deleteCategoryFn, getCategoryDetailsFn, getCategoryListFn, updateCategoryFn, updateCategoryStatusFn } from "../../controllers/admin/blog-category.controller";

export default (app: Router) => {
    app.post("/blog-category", [adminAuthorization, blogCategoryValidator], addCategoryFn)
    app.put("/blog-category/:category_id", [adminAuthorization, blogCategoryValidator], updateCategoryFn)
    app.patch("/blog-category/:category_id", [adminAuthorization], updateCategoryStatusFn)
    app.delete("/blog-category/:category_id", [adminAuthorization], deleteCategoryFn)
    app.get("/blog-category", [adminAuthorization], getCategoryListFn)
    app.get("/blog-category/:category_id", [adminAuthorization], getCategoryDetailsFn)
}