import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { closeInvoiceFn, createInvoiceFn, getAllInvoiceFn, getInvoiceFn } from "../../controllers/admin/invoice.controller";
import { invoiceValidator } from "../../validators/invoice/invoice.validator";

export default (app: Router) => {
    app.post("/invoice", [adminAuthorization, invoiceValidator], createInvoiceFn)
    app.get("/invoice/:invoice_id", [adminAuthorization], getInvoiceFn)
    app.get("/invoice", [adminAuthorization], getAllInvoiceFn)
    app.put("/invoice/:invoice_id", [adminAuthorization], closeInvoiceFn)
}