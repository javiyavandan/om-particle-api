import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { AcceptStockTransferRequest, CloseTransferRequest, CreateTransferRequest, GetAllTransferRequest, GetTransferRequestById, RejectStockTransferRequest, ReturnStockTransferRequest } from "../../services/admin/stock-transfer.service";

export const CreateTransferRequestFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, CreateTransferRequest(req), "CreateTransferRequestFn");
} 

export const AcceptTransferRequestFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, AcceptStockTransferRequest(req), "AcceptTransferRequestFn");
}

export const RejectTransferRequestFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, RejectStockTransferRequest(req), "RejectTransferRequestFn");
}

export const ReturnStockTransferRequestFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, ReturnStockTransferRequest(req), "ReturnStockTransferRequestFn");
}

export const CloseTransferRequestFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, CloseTransferRequest(req), "CloseTransferRequestFn");
}

export const GetAllTransferRequestFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, GetAllTransferRequest(req), "GetAllTransferRequestFn");
}

export const GetTransferRequestByIdFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, GetTransferRequestById(req), "GetTransferRequestByIdFn");
}