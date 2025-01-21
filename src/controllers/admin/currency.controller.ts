import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addCurrency, deleteCurrency, getAllCurrency, getCurrencyById, updateCurrency, updateCurrencyStatus } from "../../services/admin/currency.service";

export const addCurrencyFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addCurrency(req), "addCurrencyFn");
};
export const updateCurrencyFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateCurrency(req), "updateCurrencyFn");
};
export const CurrencyListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getAllCurrency(req), "CurrencyListFn");
};
export const CurrencyDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCurrencyById(req), "CurrencyDetailFn");
};
export const CurrencyStatusUpdateFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateCurrencyStatus(req), "CurrencyStatusUpdateFn");
};
export const CurrencyDeleteFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteCurrency(req), "CurrencyDeleteFn");
};