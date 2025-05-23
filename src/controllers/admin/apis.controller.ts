import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { checkStockStatusApi, createApi, deleteApi, getAllApi, getApiDetails, getStockDetailApiForCustomer, getStockListApiForCustomer, updateApi, updateStatus, updateStockStatusFromCustomer } from "../../services/admin/api.service";

export const createApiFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, createApi(req), "createApiFn")
}

export const updateApiFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateApi(req), "updateApiFn")
}

export const updateStatusFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateStatus(req), "updateStatusFn")
}

export const deleteApiFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteApi(req), "deleteApiFn")
}

export const getApiListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getAllApi(req), "getApiListFn")
}

export const getApiDetailsFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getApiDetails(req), "getApiDetailsFn")
}

export const getStockListApiForCustomerFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getStockListApiForCustomer(req), "getStockListApiForCustomerFn")
}

export const getStockDetailApiForCustomerFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getStockDetailApiForCustomer(req), "getStockDetailApiForCustomerFn")
}

export const checkStockStatusApiFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, checkStockStatusApi(req), "checkStockStatusApiFn")
}

export const updateStockStatusFromCustomerFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateStockStatusFromCustomer(req), "updateStockStatusFromCustomerFn")
}