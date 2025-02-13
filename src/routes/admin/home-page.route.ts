import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { addSectionFn, deleteSectionFn, getSectionFn, getSectionListFn, updateSectionFn, updateSectionStatusFn } from "../../controllers/admin/home-page.controller";
import { reqMultiImageParser } from "../../middlewares/multipart-file-parser";

export default (app: Router) => {
    app.post('/home-page-section', [reqMultiImageParser(["image", "hover_image"]), adminAuthorization], addSectionFn)
    app.put('/home-page-section/:section_id', [reqMultiImageParser(["image", "hover_image"]), adminAuthorization], updateSectionFn)
    app.get('/home-page-section/:section_type', [adminAuthorization], getSectionListFn)
    app.get('/home-page-section/:section_type/:section_id', [adminAuthorization], getSectionFn)
    app.delete('/home-page-section/:section_id', [adminAuthorization], deleteSectionFn)
    app.patch('/home-page-section/:section_id', [adminAuthorization], updateSectionStatusFn)
}