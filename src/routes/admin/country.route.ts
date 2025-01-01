import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { addCountryFn, CountryDeleteFn, CountryDetailFn, CountryListFn, CountryStatusUpdateFn, updateCountryFn } from "../../controllers/admin/country.controller";
import { countryValidator } from "../../validators/country/country.validator";

export default (app: Router) => {
    app.post("/country", [adminAuthorization, countryValidator], addCountryFn);
    app.put("/country/:country_id", [adminAuthorization, countryValidator], updateCountryFn)
    app.get("/country", [adminAuthorization], CountryListFn)
    app.get("/country/:country_id", [adminAuthorization], CountryDetailFn)
    app.patch("/country/:country_id", [adminAuthorization], CountryStatusUpdateFn)
    app.delete("/country/:country_id", [adminAuthorization], CountryDeleteFn)
};
