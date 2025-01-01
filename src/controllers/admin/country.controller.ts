import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addCountry, deleteCountry, getCountries, getCountry, updateCountry, updateCountryStatus } from "../../services/admin/country.service";

export const addCountryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addCountry(req), "addCountryFn");
};
export const updateCountryFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateCountry(req), "updateCountryFn");
};
export const CountryListFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCountries(req), "CountryListFn");
};
export const CountryDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCountry(req), "CountryDetailFn");
};
export const CountryStatusUpdateFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateCountryStatus(req), "CountryStatusUpdateFn");
};
export const CountryDeleteFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteCountry(req), "CountryDeleteFn");
};