import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addStock, deleteStock, getAllStock, getStock, updateStock, updateStockStatus } from "../../services/admin/add-product.service";
import { addStockCSVFile, deleteBulkStock, updateBulkStockStatus } from "../../services/admin/stock-bulk-upload.service";
import { deleteStockCSVFile } from "../../services/admin/stock-bulk-delete.service";

export const addEditBulkStock :RequestHandler = (req, res) => {
    callServiceMethod(req, res, addStockCSVFile(req), "addEditBulkStockFn");
}

export const addStockFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addStock(req), "addStockFn");
}

export const updateStockFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateStock(req), "addStockFn");
}

export const getAllStockFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getAllStock(req), "getAllStockFn");
}

export const getStockFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getStock(req), "getStockFn");
}

export const updateStockStatusFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateStockStatus(req), "updateStockStatusFn");
}

export const updateBulkStockStatusFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateBulkStockStatus(req), "updateBulkStockStatusFn");
}

export const deleteStockFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteStock(req), "deleteStockFn");
}

export const deleteBulkStockFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteBulkStock(req), "deleteBulkStockFn");
}

export const deleteStockCsv: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteStockCSVFile(req), "deleteBulkStockFn");
}