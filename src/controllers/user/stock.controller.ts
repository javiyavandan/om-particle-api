import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { getStockDetail, getStockList } from "../../services/user/stock.service";

export const getStockListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getStockList(req), "getStockListFn")
}

export const getStockDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getStockDetail(req), "getStockDetailFn")
}