import { Router } from "express";
import { addEditBulkStock, addStockFn, deleteBulkStockFn, deleteStockCsv, deleteStockFn, editStockCSVFileFn, getAllStockFn, getStockFn, TransferStockByCompanyFn, updateBulkStockStatusFn, updateStockFn, updateStockStatusFn } from "../../controllers/admin/stock.controller";
import { adminAuthorization } from "../../middlewares/authenticate";
import { addStockValidator } from "../../validators/stock/stock.validator";
import { reqProductBulkUploadFileParser } from "../../middlewares/multipart-file-parser";
export default (app: Router) => {
    app.post("/stock", [adminAuthorization, addStockValidator], addStockFn);
    app.put("/stock/:diamond_id", [adminAuthorization, addStockValidator], updateStockFn);
    app.get("/stock", [adminAuthorization], getAllStockFn);
    app.get("/stock/:diamond_id", [adminAuthorization], getStockFn);
    app.patch("/stock/:diamond_id", [adminAuthorization], updateStockStatusFn);
    app.delete("/stock/:diamond_id", [adminAuthorization], deleteStockFn);
    app.post("/stock/import", [adminAuthorization, reqProductBulkUploadFileParser("stock_file")], addEditBulkStock);
    app.patch("/stock-update-status", [adminAuthorization], updateBulkStockStatusFn);
    app.delete("/stock-bulk-delete/:stock_id", [adminAuthorization], deleteBulkStockFn);
    app.post("/stock-bulk-delete-csv", [adminAuthorization, reqProductBulkUploadFileParser("stock_file")], deleteStockCsv);
    app.put("/stock-transfer/:company_id", [adminAuthorization], TransferStockByCompanyFn);
    app.put("/stock-bulk-edit", [adminAuthorization, reqProductBulkUploadFileParser("stock_file")], editStockCSVFileFn);
}