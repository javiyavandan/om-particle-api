import fs from "fs";
import { IMAGE_TYPE_LOCATION } from "../utils/app-constants";
import { TImageType } from "../data/types/common/common.type";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../utils/app-messages";
import { resSuccess, resUnknownError } from "../utils/shared-functions";
import { s3UploadObject } from "./s3-client.helper";

export const createFolderIfNot = (path: string) => {
  let expectedFolderList = path.split("/");
  expectedFolderList.reduce((prevPath, currentPath) => {
    const path = prevPath + currentPath + "/";
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    return path;
  }, "/");
};

export const moveFileToS3ByType = async (
  file: Express.Multer.File,
  type: TImageType
) => {
  let destinationPath = IMAGE_TYPE_LOCATION[type] + "/" + file.filename;

  const fileStream = fs.readFileSync(file.path);
  const data = await s3UploadObject(fileStream, destinationPath, file.mimetype);
  fs.rmSync(file.path);
  if (data.code !== DEFAULT_STATUS_CODE_SUCCESS) {
    return data;
  }
  return resSuccess({ data: destinationPath });
};
export const moveFileToLocation = (
  fileName: string,
  sourcePath: string,
  destinationFolder: string,
  originalname: string
) => {
  let error;
  const destinationPath = destinationFolder + "/" + originalname;
  createFolderIfNot(destinationFolder);

  fs.rename(sourcePath + "/" + fileName, destinationPath, function (err) {
    if (err) {
      error = resUnknownError({ data: err });
    }
  });

  if (error) {
    return error;
  }

  return resSuccess({ data: destinationPath });
};
