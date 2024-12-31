import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {
  S3_ACCESS_KEY_ID,
  S3_REGION,
  S3_BUCKET_NAME,
  S3_SECRET_ACCESS_KEY,
} from "../config/env.var";
import {
  getLocalDate,
  resSuccess,
  resUnknownError,
} from "../utils/shared-functions";
import { DEFAULT_STATUS_CODE_ERROR, DEFAULT_STATUS_CODE_SUCCESS } from "../utils/app-messages";
import { saveS3LogsToFile } from "./log.hepler";

const S3 = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

enum S3ServiceMethods {
  PutObjectCommand = 1,
  GetObjectCommand = 2,
  DeleteObjectCommand = 3,
}

const getS3ServiceMethod = new Map<number, any>([
  [S3ServiceMethods.PutObjectCommand, PutObjectCommand],
  [S3ServiceMethods.GetObjectCommand, GetObjectCommand],
  [S3ServiceMethods.DeleteObjectCommand, DeleteObjectCommand],
]);

const getS3ServiceMethodLabel = new Map<number, any>([
  [S3ServiceMethods.PutObjectCommand, "PutObjectCommand"],
  [S3ServiceMethods.GetObjectCommand, "GetObjectCommand"],
  [S3ServiceMethods.DeleteObjectCommand, "DeleteObjectCommand"],
]);

export const s3UploadObject = async (
  file: any,
  path: string,
  mimetype: string
) => {
  
  const payload = {
    Bucket: S3_BUCKET_NAME,
    Key: path,
    Body: file,
    ContentType: mimetype,
  };
  const result = await S3RequestPromise(
    S3ServiceMethods.PutObjectCommand,
    payload
  );
  return result;
};

export const s3RemoveObject = async (key: string) => {
  const payload = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
  };
  const result = await S3RequestPromise(
    S3ServiceMethods.DeleteObjectCommand,
    payload
  );
  return result;
};

export const s3GetImageObject = async (key: string) => {
  const payload = { Bucket: S3_BUCKET_NAME, Key: key };
  const result: any = await S3RequestPromise(
    S3ServiceMethods.GetObjectCommand,
    payload
  );
  if(result.code !== DEFAULT_STATUS_CODE_SUCCESS){
    return result
  }
  const img = await Buffer.from(await streamToString(result.Body), "base64");
  return img;

  // response with length and content type
  return { img, length: img.length, type: result.ContentType };
};

const streamToString = async (stream: any): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: any = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
  });

const S3RequestPromise = async (S3ServiceMethod: number, payload: any) => {
  const requestTime = getLocalDate();
  let result = null;
  try {
    const method = getS3ServiceMethod.get(S3ServiceMethod);
    const s3Response: any = await S3.send(new method(payload));
    result = resSuccess({ data: s3Response });
  } catch (e) {
    result = resUnknownError({ data: e });
  }
  const responseTime = getLocalDate();
  saveS3LogsToFile(
    requestTime,
    getS3ServiceMethodLabel.get(S3ServiceMethod),
    S3ServiceMethod === S3ServiceMethods.PutObjectCommand
      ? { ...payload, Body: "" }
      : payload,
    responseTime,
    result.code === DEFAULT_STATUS_CODE_ERROR ? result.data : "success"
  );

  return result;
};
