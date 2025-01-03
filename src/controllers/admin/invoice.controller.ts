import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { createInvoice, getAllInvoice, getInvoice } from "../../services/admin/invoice.service";

export const createInvoiceFn :RequestHandler = (req, res) => {
    callServiceMethod(req, res, createInvoice(req), "createInvoiceFn");
}

export const getInvoiceFn :RequestHandler = (req, res) => {
    callServiceMethod(req, res, getInvoice(req), "getInvoiceFn");
}

export const getAllInvoiceFn :RequestHandler = (req, res) => {
    callServiceMethod(req, res, getAllInvoice(req), "getAllInvoiceFn");
}