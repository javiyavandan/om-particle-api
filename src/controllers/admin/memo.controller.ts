import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { createMemo, getAllMemo, getMemo, returnMemoStock } from "../../services/admin/memo.service";

export const createMemoFn :RequestHandler = (req, res) => {
    callServiceMethod(req, res, createMemo(req), "createMemoFn");
}

export const getMemoFn :RequestHandler = (req, res) => {
    callServiceMethod(req, res, getMemo(req), "getMemoFn");
}

export const getAllMemoFn :RequestHandler = (req, res) => {
    callServiceMethod(req, res, getAllMemo(req), "getAllMemoFn");
}

export const returnMemoStockFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, returnMemoStock(req), "returnMemoStockFn");
}