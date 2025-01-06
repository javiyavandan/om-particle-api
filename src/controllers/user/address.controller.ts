import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addAddress, addressList, deleteAddress, updateAddress } from "../../services/user/address.service";

export const addAddressFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, addAddress(req), "addAddressFn");
};

export const updateAddressFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, updateAddress(req), "updateAddressFn");
};

export const deleteAddressFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, deleteAddress(req), "deleteAddressFn");
};

export const getAllAddressFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, addressList(req), "getAllAddressFn");
};

