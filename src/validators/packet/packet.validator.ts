import { RequestHandler } from "express";
import modelValidator from "../model.validator";
import { addPacketRules } from "./packet.rule";

export const addPacketValidator: RequestHandler = async (req, res, next) => {
    return await modelValidator(req, res, next, addPacketRules)
}