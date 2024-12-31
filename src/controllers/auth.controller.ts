import { RequestHandler } from "express";
import {

  test,
} from "../services/auth.service";
import { callServiceMethod } from "./base.controller";

export const testFn: RequestHandler = (req, res) => {
  callServiceMethod(req, res, test(req), "registerSystemUserFn");
};


