import {
  JWT_EXPIRED_ERROR_NAME,
  JWT_SECRET_KEY,
  RESET_JWT_TOKEN_EXPRATION_TIME,
  USER_JWT_EXPIRATION_TIME,
} from "../utils/app-constants";
import jwt from "jsonwebtoken";
import { resSuccess, resUnauthorizedAccess } from "../utils/shared-functions";
import { ICreateUserJWT } from "../data/types/jwt/jwt.type";
import { TUserType } from "../data/types/common/common.type";

export const createUserJWT: ICreateUserJWT = (
  id,
  data,
  userType: TUserType
) => {
  const jwtExpiredTime = USER_JWT_EXPIRATION_TIME[userType];
  const token = jwt.sign(data, JWT_SECRET_KEY, {
    expiresIn: jwtExpiredTime.tokenTime,
  });
  const refreshToken = jwt.sign(data, JWT_SECRET_KEY, {
    expiresIn: jwtExpiredTime.refreshTokenTime,
  });
  return { token, refreshToken };
};

export const verifyJWT = async (token: string) => {
  try {
    const result = await jwt.verify(token, JWT_SECRET_KEY);
    return resSuccess({ data: result });
  } catch (e: any) {
    if (e?.name === JWT_EXPIRED_ERROR_NAME) {
      return resUnauthorizedAccess({
        data: e,
        message: JWT_EXPIRED_ERROR_NAME,
      });
    }
    throw e;
  }
};

export const createResetToken = (id: number) => {
  const token = jwt.sign({ id }, JWT_SECRET_KEY, {
    expiresIn: RESET_JWT_TOKEN_EXPRATION_TIME,
  });
  return token;
};

