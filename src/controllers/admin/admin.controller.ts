import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import {
  contactUsList,
  updateUserStatus,
  userDetail,
  userList,
  userVerify,
} from "../../services/admin/admin.service";

export const getAllUser: RequestHandler = (req, res) => {
  callServiceMethod(req, res, userList(req), "userList");
};
export const userDetailFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, userDetail(req), "userListFn");
};
export const userVerifyFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, userVerify(req), "userVerifyFn");
};
export const updateUserStatusFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, updateUserStatus(req), "updateUserStatusFn");
};

// export const dashboardFn: RequestHandler = (req, res) => {
//   callServiceMethod(req, res, dashboard(req), "dashboardFn");
// };

export const contactUsListFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, contactUsList(req), "contactUsListFn");
};
