import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import {
  getDiamondConciergeDetail,
  getDiamondConciergeList,
} from "../../services/admin/concierge.service";

export const getDiamondConciergeListFn: RequestHandler = (req, res) => {
  callServiceMethod(
    req,
    res,
    getDiamondConciergeList(req),
    "getDiamondConciergeListFn"
  );
};
export const getDiamondConciergeDetailFn: RequestHandler = (req, res) => {
  callServiceMethod(
    req,
    res,
    getDiamondConciergeDetail(req),
    "getDiamondConciergeDetailFn"
  );
};
