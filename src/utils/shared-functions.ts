import axios, { AxiosResponse } from "axios";
import { TBitFieldValue, TDataExitResponse, TResponse } from "../data/types/common/common.type";
import {
  BAD_REQUEST_CODE,
  BAD_REQUEST_MESSAGE,
  DATA_ALREADY_EXITS,
  DEFAULT_STATUS_CODE_ERROR,
  DEFAULT_STATUS_CODE_SUCCESS,
  DEFAULT_STATUS_CODE_SUCCESS_BUT_NO_CONTENT,
  DEFAULT_STATUS_ERROR,
  DEFAULT_STATUS_SUCCESS,
  NOT_FOUND_CODE,
  NOT_FOUND_MESSAGE,
  UNAUTHORIZED_ACCESS_CODE,
  UNAUTHORIZED_ACCESS_MESSAGE,
  UNKNOWN_ERROR_TRY_AGAIN,
  UNPROCESSABLE_ENTITY_CODE,
  UNPROCESSABLE_ENTITY_MESSAGE,
} from "./app-messages";
import { HUBSPOT_SYNC_URL, HUBSPOT_TOKEN } from "../config/env.var";
import { Sequelize } from "sequelize";
import { IQueryPagination } from "../data/interfaces/common/common.interface";
import { BIT_FIELD_VALUES, GET_HTTP_METHODS_LABEL, PER_PAGE_ROWS } from "./app-constants";
import { HTTP_METHODS } from "./app-enumeration";

export const parseData = (data: Object) => {
  try {
    var info = JSON.stringify(data);
    if (String(info) === "{}") {
      info = String(data);
    }
    return info;
  } catch {
    return String(data);
  }
};

export const resSuccess: TResponse = (payload) => {
  return {
    code: payload?.code || DEFAULT_STATUS_CODE_SUCCESS,
    status: payload?.status || DEFAULT_STATUS_SUCCESS,
    message: payload?.message || DEFAULT_STATUS_SUCCESS,
    data: payload?.data || null,
  };
};

export const resUnauthorizedAccess: TResponse = (payload) => {
  return {
    code: payload?.code || UNAUTHORIZED_ACCESS_CODE,
    status: payload?.status || DEFAULT_STATUS_ERROR,
    message: payload?.message || UNAUTHORIZED_ACCESS_MESSAGE,
    data: payload?.data || null,
  };
};

export const resUnprocessableEntity: TResponse = (payload) => {
  return {
    code: payload?.code || UNPROCESSABLE_ENTITY_CODE,
    status: payload?.status || DEFAULT_STATUS_ERROR,
    message: payload?.message || UNPROCESSABLE_ENTITY_MESSAGE,
    data: payload?.data || null,
  };
};


export const resUnknownError: TResponse = (payload) => {
  return {
    code: payload?.code || DEFAULT_STATUS_CODE_ERROR,
    status: payload?.status || DEFAULT_STATUS_ERROR,
    message: payload?.message || UNKNOWN_ERROR_TRY_AGAIN,
    data: payload?.data || null,
  };
};

export const resBadRequest: TResponse = (payload) => {
  return {
    code: payload?.code || BAD_REQUEST_CODE,
    status: payload?.status || DEFAULT_STATUS_ERROR,
    message: payload?.message || BAD_REQUEST_MESSAGE,
    data: payload?.data || null,
  };
};

export const resNotFound: TResponse = (payload) => {
  return {
    code: payload?.code || NOT_FOUND_CODE,
    status: payload?.status || DEFAULT_STATUS_ERROR,
    message: payload?.message || NOT_FOUND_MESSAGE,
    data: payload?.data || null,
  };
};
export const resError: TResponse = (payload) => {
  return {
    code: payload?.code || DEFAULT_STATUS_CODE_ERROR,
    status: payload?.status || DEFAULT_STATUS_ERROR,
    message: payload?.message || DEFAULT_STATUS_ERROR,
    data: payload?.data || null,
  };
};

export const resErrorDataExit: TDataExitResponse = (payload) => {
  return {
    code: payload?.code || BAD_REQUEST_CODE,
    status: payload?.status || DEFAULT_STATUS_ERROR,
    message: prepareMessageFromParams(DATA_ALREADY_EXITS, [["field_name", payload?.message]]) || prepareMessageFromParams(DATA_ALREADY_EXITS, [["field_name", "Data"]]),
    data: payload?.data || null,
  };
};

export const getLocalDate = () => {
  return new Date();
};

export const getLogSaveDateFormat = (date: Date) => {
  return {
    date: `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`,
    time: `${date.getHours()}00`,
  };
};

export const genrerateRandomString = (length: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let result = "";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};


export const prepareMessageFromParams = (
  message: string,
  params: [string, string][]
) => {
  let resultMessage = message;
  for (const [key, value] of params) {
    resultMessage = resultMessage.replace(
      new RegExp("<<" + key + ">>", "g"),
      value
    );
  }
  return resultMessage;
};


export const returnHubspotHeader = () => {
  const headers = {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    "Content-Type": "application/json",
  };
  return headers;
};

export const columnValueLowerCase = (field_name: any, value: any) => {
  return Sequelize.where(
    Sequelize.fn("LOWER", Sequelize.col(`${[field_name]}`)),
    value.toLowerCase()
  );
};

export const getAddHubspotRequest = async <T>(
  url: string,
  model: T
): Promise<string> => {
  try {
    const headers = returnHubspotHeader();
    const response: AxiosResponse = await axios.post(
      HUBSPOT_SYNC_URL + url,
      model,
      { headers }
    );
    if (
      response.status === DEFAULT_STATUS_CODE_SUCCESS_BUT_NO_CONTENT ||
      response.status === DEFAULT_STATUS_CODE_SUCCESS
    ) {
      return response.data;
    } else {
      throw new Error(`Non-success status code: ${response.status}`);
    }
  } catch (error) {
    throw error;
  }
};

export const getInitialPaginationFromQuery = (
  query: Record<string, any>
): IQueryPagination => {
  let findIsActive;

  if (
    query &&
    typeof query.is_active == "string" &&
    BIT_FIELD_VALUES.includes(query.is_active)
  ) {
    findIsActive = query.is_active as TBitFieldValue;
  }

  return {
    per_page_rows: query.per_page_rows || PER_PAGE_ROWS,
    current_page: query.current_page || 1,
    order_by: query.order_by || "DESC",
    sort_by: query.sort_by || "id",
    is_active: findIsActive,
    total_pages: 0,
    total_items: 0,
    search_text: query.search_text || "",
  };
};

export const getMethodFromRequest = (method: string) => {
  switch (method) {
    case GET_HTTP_METHODS_LABEL[HTTP_METHODS.Get]:
      return HTTP_METHODS.Get;
    case GET_HTTP_METHODS_LABEL[HTTP_METHODS.Post]:
      return HTTP_METHODS.Post;
    case GET_HTTP_METHODS_LABEL[HTTP_METHODS.Put]:
      return HTTP_METHODS.Put;
    case GET_HTTP_METHODS_LABEL[HTTP_METHODS.Delete]:
      return HTTP_METHODS.Delete;
    case GET_HTTP_METHODS_LABEL[HTTP_METHODS.Patch]:
      return HTTP_METHODS.Patch;
    default:
      return 0;
  }
};