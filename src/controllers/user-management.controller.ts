import { RequestHandler } from "express";
import {
  addBusinessUser,
  deleteBusinessUser,
  getAllBusinessUsers,
  getBusinessUserById,
  updateBusinessUser,
} from "../services/user-management.service";
import { callServiceMethod } from "./base.controller";

export const getAllBusinessUsersFn: RequestHandler = (req, res) => {
  callServiceMethod(
    req,
    res,
    getAllBusinessUsers(req),
    "getAllBusinessUsersFn"
  );
};

export const getBusinessUserByIdFn: RequestHandler = (req, res) => {
  callServiceMethod(
    req,
    res,
    getBusinessUserById(req),
    "getBusinessUserByIdFn"
  );
};

export const addBusinessUserFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, addBusinessUser(req), "addBusinessUserFn");
};

export const updateBusinessUserFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, updateBusinessUser(req), "updateBusinessUserFn");
};

export const deleteBusinessUserFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, deleteBusinessUser(req), "deleteBusinessUserFn");
};
