import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { reqProductBulkUploadFileParser } from "../../middlewares/multipart-file-parser";
import { addEditBulkPacket, addPacketFn, deleteBulkPacketFn, deletePacketFn, getAllPacketsFn, getPacketFn, updatePacketFn, updatePacketStatusBulkFn, updatePacketStatusFn } from "../../controllers/admin/packet.controller";
import { addPacketValidator } from "../../validators/packet/packet.validator";

export default (app: Router) => {
    app.post("/packet/import", [adminAuthorization, reqProductBulkUploadFileParser("packet_file")], addEditBulkPacket);
    app.post("/packet", [adminAuthorization, addPacketValidator], addPacketFn);
    app.put("/packet/:diamond_id", [adminAuthorization, addPacketValidator], updatePacketFn);
    app.patch("/packet/:diamond_id", [adminAuthorization], updatePacketStatusFn);
    app.delete("/packet/:diamond_id", [adminAuthorization], deletePacketFn);
    app.patch("/packet-update-status", [adminAuthorization], updatePacketStatusBulkFn);
    app.delete("/packet-bulk-delete/:packet_id", [adminAuthorization], deleteBulkPacketFn);
    app.get("/packet", [adminAuthorization], getAllPacketsFn);
    app.get("/packet/:diamond_id", [adminAuthorization], getPacketFn);
}