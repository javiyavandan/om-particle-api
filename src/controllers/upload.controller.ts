import { RequestHandler } from "express";
import { uploadImage } from "../services/upload.service";
import { callServiceMethod } from "./base.controller";

export const uploadImageFn: RequestHandler = (req, res) => {
  callServiceMethod(
    req,
    res,
    uploadImage(req, res),
    "uploadImageFn"
  );
};
