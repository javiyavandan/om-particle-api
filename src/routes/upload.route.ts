import { Router } from "express";
import { uploadImageFn } from "../controllers/upload.controller";

export default (app: Router) => {
  app.post("/upload-image", [], uploadImageFn);
};
