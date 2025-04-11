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
import { QueryTypes, Sequelize } from "sequelize";
import { IQueryPagination } from "../data/interfaces/common/common.interface";
import { BIT_FIELD_VALUES, GET_HTTP_METHODS_LABEL, PER_PAGE_ROWS } from "./app-constants";
import { ActiveStatus, HTTP_METHODS } from "./app-enumeration";
import dbContext from "../config/dbContext";
import cron from "node-cron";
import CurrencyJson from "../model/currency-json.model";

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

export const refreshMaterializedDiamondListView = async () => {
  try {
    return await dbContext.query("REFRESH MATERIALIZED VIEW diamond_list; REFRESH MATERIALIZED VIEW memo_list;  REFRESH MATERIALIZED VIEW invoice_list;");
  } catch (error) {
    throw error;
  }
};

const getDateString = (date: Date) => date.toISOString().slice(0, 10);

const fetchCurrency = async (date: Date) => {
  const formattedDate = getDateString(date);
  try {
    const response = await axios.get(`https://${formattedDate}.currency-api.pages.dev/v1/currencies/usd.json`);
    return response.data.usd;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    } else {
      throw error;
    }
  }
};

export const scheduleCurrencyFetch = () => {
  const scheduler = cron.schedule("0 0 */12 * * *", async () => {
    try {
      let currentDate = new Date();

      for (let i = 0; i < 30; i++) {
        const data = await fetchCurrency(currentDate);
        if (data) {
          const currencyData = {
            json: data,
            date: currentDate,
            created_at: getLocalDate(),
          };
          await CurrencyJson.create(currencyData);
          break;
        }
        currentDate.setDate(currentDate.getDate() - 1);
      }
    } catch (error) {
      console.error("Error fetching currency data:", error);
    }
  });
  scheduler.start();
};

export const getCurrencyPrice = async (code: string) => {
  try {
    let apiCurrencyData;

    let defaultCode;

    const currency: any = await dbContext.query(
      `SELECT * FROM currency_masters WHERE is_default = '${ActiveStatus.Active}'`, {
      type: QueryTypes.SELECT,
    })

    defaultCode = currency?.[0].code;

    const currencyJson: any = await dbContext.query(
      `SELECT * FROM currency_jsons ORDER BY date DESC LIMIT 1`, {
      type: QueryTypes.SELECT,
    })

    apiCurrencyData = currencyJson?.[0].json;

    if (apiCurrencyData) {
      if (code) {
        if (!apiCurrencyData[code.toLowerCase()]) {
          return apiCurrencyData[defaultCode.toLowerCase()];
        } else {
          return apiCurrencyData[code.toLowerCase()];
        }
      } else {
        return apiCurrencyData[defaultCode.toLowerCase()];
      }
    }

  } catch (error) {
    throw error;
  }
}

export const getCurrencyCode = async () => {
  try {

    let code;

    await axios.get('https://ipapi.co/currency/')
      .then((response) => { code = response.data })
      .catch((error) => {
        throw error
      });

    return code;
  } catch (error) {
    throw error;
  }
}