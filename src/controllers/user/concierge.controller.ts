import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { diamondConciergeForm } from "../../services/user/conciergeForm.service";

export const addDiamondConciergeFn: RequestHandler = (req, res) => {
  callServiceMethod(
    req,
    res,
    diamondConciergeForm(req),
    "addDiamondConciergeFn"
  );
};
