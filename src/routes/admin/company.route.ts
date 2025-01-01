import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { addCompanyFn, CompanyDeleteFn, CompanyDetailFn, CompanyListFn, CompanyStatusUpdateFn, updateCompanyFn } from "../../controllers/admin/company.controller";
import { companyValidator } from "../../validators/company/company.validator";

export default (app: Router) => {
    app.post("/company", [adminAuthorization, companyValidator], addCompanyFn);
    app.put("/company/:company_id", [adminAuthorization, companyValidator], updateCompanyFn)
    app.get("/company", [adminAuthorization], CompanyListFn)
    app.get("/company/:company_id", [adminAuthorization], CompanyDetailFn)
    app.patch("/company/:company_id", [adminAuthorization], CompanyStatusUpdateFn)
    app.delete("/company/:company_id", [adminAuthorization], CompanyDeleteFn)
};
