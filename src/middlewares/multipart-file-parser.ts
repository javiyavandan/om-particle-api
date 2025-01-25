import { RequestHandler } from "express";
import { createFolderIfNot } from "../helpers/file-helper";
import { STORE_TEMP_FILE_PATH, STORE_TEMP_IMAGE_PATH } from "../config/env.var";
import multer from "multer";
import { getLocalDate, resUnknownError } from "../utils/shared-functions";
import path from "path";
import { DEFAULT_STATUS_CODE_ERROR } from "../utils/app-messages";
import { PRODUCT_BULK_UPLOAD_FILE_SIZE } from "../utils/app-constants";

const upload = (destinationPath: string, options?: multer.Options) =>
  multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, destinationPath);
      },
      filename: function (_req, file, cb) {
        const imagePath = file.originalname
          .slice(0, file.originalname.lastIndexOf("."))
          .replace(/[ ()]/g, "_");
        const ext = path.extname(file.originalname);
        cb(
          null,
          file.fieldname +
            "-" +
            imagePath +
            "-" +
            getLocalDate().valueOf() +
            ext
        );
      },
    }),
    limits: options?.limits,
  });

export const reqSingleImageParser =
  (field_name: string): RequestHandler =>
  (req, res, next) => {
    try {
      const session_res = req.body.session_res;
      createFolderIfNot(STORE_TEMP_IMAGE_PATH);
      upload(STORE_TEMP_IMAGE_PATH).single(field_name)(req, res, (err) => {
        if (err) {
          return res
            .status(DEFAULT_STATUS_CODE_ERROR)
            .send(resUnknownError({ data: err }));
        }
        req.body["session_res"] = session_res;
        return next();
      });
    } catch (e) {
      return res
        .status(DEFAULT_STATUS_CODE_ERROR)
        .send(resUnknownError({ data: e }));
    }
  };

export const reqProductBulkUploadFileParser =
  (field_name: string): RequestHandler =>
  (req, res, next) => {
    try {
      const session_res = req.body.session_res;
      createFolderIfNot(STORE_TEMP_FILE_PATH);
      upload(STORE_TEMP_FILE_PATH, {
        limits: { fileSize: PRODUCT_BULK_UPLOAD_FILE_SIZE * 1000 * 1000 },
        dest: STORE_TEMP_FILE_PATH,
      }).single(field_name)(req, res, (err) => {
        if (err) {
          return res
            .status(DEFAULT_STATUS_CODE_ERROR)
            .send(resUnknownError({ data: err }));
        }
        req.body["session_res"] = session_res;
        return next();
      });
    } catch (e) {
      return res
        .status(DEFAULT_STATUS_CODE_ERROR)
        .send(resUnknownError({ data: e }));
    }
  };

  export const reqMultiImageParser =
  (fieldArray: string[]): RequestHandler =>
  (req, res, next) => {
    try {
      const session_res = req.body.session_res;
      createFolderIfNot(STORE_TEMP_IMAGE_PATH);
      upload(STORE_TEMP_IMAGE_PATH).fields(
        fieldArray.map((name) => ({ name }))
      )(req, res, (err) => {
        if (err) {
          return res
            .status(DEFAULT_STATUS_CODE_ERROR)
            .send(resUnknownError({ data: err }));
        }
        req.body["session_res"] = session_res;
        return next();
      });
    } catch (e) {
      return res
        .status(DEFAULT_STATUS_CODE_ERROR)
        .send(resUnknownError({ data: e }));
    }
  };