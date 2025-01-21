import { compareDiamonds } from "../../services/user/compare-diamonds.service";
import { callServiceMethod } from "../base.controller";
import { RequestHandler } from "express";

export const compareDiamondsFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, compareDiamonds(req), "compareDiamondsFn");
};

