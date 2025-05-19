import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { addPacketCSVFile, deleteBulkPacket, updateBulkPacketStatus } from "../../services/admin/packet-diamonds-bulk.service";
import { addPacket, deletePacket, getAllPackets, getPacket, updatePacket, updatePacketStatus } from "../../services/admin/packet-diamond.service";
import { deletePacketCSVFile } from "../../services/admin/packet-diamonds-delete-bulk.service";

export const addEditBulkPacket: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addPacketCSVFile(req), "addEditBulkPacketFn");
}

export const addPacketFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, addPacket(req), "addPacketFn");
}

export const updatePacketFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updatePacket(req), "updatePacketFn");
}

export const deletePacketFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deletePacket(req), "deletePacketFn");
}

export const updatePacketStatusFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updatePacketStatus(req), "updatePacketStatusFn");
}

export const updatePacketStatusBulkFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateBulkPacketStatus(req), "updatePacketStatusBulkFn");
}

export const deleteBulkPacketFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deleteBulkPacket(req), "deleteBulkPacketFn");
}

export const getAllPacketsFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getAllPackets(req), "getAllPacketsFn");
}

export const getPacketFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getPacket(req), "getPacketFn");
}

export const bulkDeletePacketFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, deletePacketCSVFile(req), "bulkDeletePacketFn")
}