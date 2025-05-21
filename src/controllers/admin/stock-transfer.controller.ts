import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { CreateTransferRequest } from "../../services/admin/stock-transfer.service";

export const CreateTransferRequestFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, CreateTransferRequest(req), "CreateTransferRequestFn");
} 