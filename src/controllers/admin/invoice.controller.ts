import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { createInvoice } from "../../services/admin/invoice.service";

export const createInvoiceFn :RequestHandler = (req, res) => {
    callServiceMethod(req, res, createInvoice(req), "createInvoiceFn");
}