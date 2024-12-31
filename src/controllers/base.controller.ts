import {
  DEFAULT_STATUS_CODE_ERROR,
  DEFAULT_STATUS_CODE_SUCCESS,
  DEFAULT_STATUS_ERROR,
  UNKNOWN_ERROR_TRY_AGAIN,
} from "../utils/app-messages";
import { getLocalDate, parseData } from "../utils/shared-functions";
import { Request, Response } from "express";
import { saveServerLogs } from "../helpers/log.hepler";
import { encryptResData } from "../middlewares/req-res-encoder";
import { SECURE_COMMUNICATION } from "../config/env.var";

export async function callServiceMethod(
  req: Request,
  res: Response,
  serviceMethodTocall: any,
  actionName: string
) {
  const requestTime = getLocalDate();
  let response;
  try {
    const data = await serviceMethodTocall;
    response = {
      status: data?.code ? data.code : DEFAULT_STATUS_CODE_SUCCESS,
      data: data ? data : null,
    };
  } catch (err: any) {
    response = {
      status: err.code ? err.code : DEFAULT_STATUS_CODE_ERROR,
      data: {
        code: err.code ? err.code : DEFAULT_STATUS_CODE_ERROR,
        message: err.message ? err.message : UNKNOWN_ERROR_TRY_AGAIN,
        status: err.status ? err.status : DEFAULT_STATUS_ERROR,
        data: err.data && typeof err != "object" ? parseData(err) : null,
      },
    };
  }

  saveServerLogs({
    requestTime,
    url: req.originalUrl,
    action: actionName,
    body: req.body,
    responseTime: getLocalDate(),
    response: response.data,
  });

  const encodedResponse = SECURE_COMMUNICATION
    ? encryptResData(response.data)
    : response.data;
  return res.status(response.status).send(encodedResponse);
}
