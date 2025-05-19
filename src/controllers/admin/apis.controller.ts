import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { createApi, deleteApi, getAllApi, getApiDetails, updateApi, updateStatus } from "../../services/admin/api.service";

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