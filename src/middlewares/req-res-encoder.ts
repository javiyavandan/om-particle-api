import crypto from "crypto";
import { RequestHandler } from "express";
import { SECURE_COMMUNICATION } from "../config/env.var";
import {
  CIPHER_ALGORITHM,
  PRIVATE_KEY,
  PUBLIC_KEY,
  SIGNATURE_ALGORITHM,
} from "../utils/app-constants";
import {
  DEFAULT_STATUS_CODE_ERROR,
  UNAUTHORIZED_ACCESS_CODE,
} from "../utils/app-messages";
import {
  genrerateRandomString,
  resSuccess,
  resUnauthorizedAccess,
  resUnknownError,
} from "../utils/shared-functions";

export const bodyDecipher: RequestHandler = (req, res, next) => {
  if (req.body) {
    try {
      // -- ** -- ** -- ** -- ** -- ** -- ** -- ** -- ** --
      // const data = encryptResData(req.body);
      // console.log(data);

      // -- ** -- ** -- ** -- ** -- ** -- ** -- ** -- ** --
      if (SECURE_COMMUNICATION) {
        const result = decryptReqBody(req.body);
        if (result.code === UNAUTHORIZED_ACCESS_CODE) {
          return res.status(result.code).send(result);
        }
        req.body = result.data;
      }

      return next();
    } catch (e) {
      return res
        .status(DEFAULT_STATUS_CODE_ERROR)
        .send(resUnknownError({ data: e }));
    }
  }
};

export const encryptResData = (payload: any) => {
  const stringifyPayload = JSON.stringify(payload);
  const cipherKeyString = genrerateRandomString(16);
  const cipherKey = Buffer.from(cipherKeyString);
  const key = encryptKeyUsingPublicKey(cipherKey);
  const cipherIv = crypto.randomBytes(16);
  const encryptedBody = encryptData(stringifyPayload, cipherKey, cipherIv);
  const signature = signDataWithPrivateKey(stringifyPayload);
  return {
    key,
    iv: cipherIv.toString("base64"),
    signature,
    data: encryptedBody,
  };
};

export const decryptReqBody = (payload: any) => {
  const { key, iv, signature, data } = payload;
  const decipherKey = decryptKeyUsingPrivateKey(Buffer.from(key, "base64"));
  const decipherIv = Buffer.from(iv, "utf-8");
  const decryptedBody = decryptData(data, decipherKey, decipherIv);
  if (verifyDataWithPublicKey(decryptedBody, signature)) {
    return resSuccess({ data: JSON.parse(decryptedBody) });
  } else {
    throw resUnauthorizedAccess();
  }
};

const encryptKeyUsingPublicKey = (key: Buffer): String => {
  return crypto
    .publicEncrypt(
      { key: PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      key
    )
    .toString("base64");
};

const decryptKeyUsingPrivateKey = (key: Buffer): Buffer => {
  return crypto.privateDecrypt(
    { key: PRIVATE_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
    key
  );
};

const encryptData = (
  data: string,
  cipherKey: Buffer,
  cipherIv: Buffer
): string => {
  const cipher = crypto.createCipheriv(CIPHER_ALGORITHM, cipherKey, cipherIv);
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

const decryptData = (data: string, decipherKey: Buffer, decipherIv: Buffer) => {
  const decipher = crypto.createDecipheriv(
    CIPHER_ALGORITHM,
    decipherKey,
    decipherIv
  );
  decipher.setAutoPadding(true);
  let decrypted = decipher.update(data, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

const signDataWithPrivateKey = (data: string): string => {
  const sign = crypto.createSign(SIGNATURE_ALGORITHM);
  sign.update(data);
  return sign.sign(PRIVATE_KEY, "base64");
};

const verifyDataWithPublicKey = (data: string, signature: string): Boolean => {
  const verify = crypto.createVerify(SIGNATURE_ALGORITHM);
  verify.update(data);
  return verify.verify(PUBLIC_KEY, signature, "base64");
};
