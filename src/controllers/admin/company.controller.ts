import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addCompany, deleteCompany, getCompany, getCompanyList, updateCompany, updateCompanyStatus } from "../../services/admin/company.service";

export const addCompanyFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addCompany(req), "addCompanyFn");
};
export const updateCompanyFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateCompany(req), "updateCompanyFn");
};
export const CompanyListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCompanyList(req), "CompanyListFn");
};
export const CompanyDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCompany(req), "CompanyDetailFn");
};
export const CompanyStatusUpdateFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateCompanyStatus(req), "CompanyStatusUpdateFn");
};
export const CompanyDeleteFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteCompany(req), "CompanyDeleteFn");
};