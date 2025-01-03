import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { createInvoiceFn } from "../../controllers/admin/invoice.controller";
import { invoiceValidator } from "../../validators/invoice/invoice.validator";

export default (app: Router) => {
    app.post("/invoice", [adminAuthorization, invoiceValidator], createInvoiceFn)
}