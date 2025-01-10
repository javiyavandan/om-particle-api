import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { addCurrencyFn, CurrencyDeleteFn, CurrencyDetailFn, CurrencyListFn, CurrencyStatusUpdateFn, updateCurrencyFn } from "../../controllers/admin/currency.controller";
import { currencyValidator } from "../../validators/currency/currency.validator";

export default (app: Router) => {
    app.post("/currency", [adminAuthorization, currencyValidator], addCurrencyFn);
    app.put("/currency/:currency_id", [adminAuthorization, currencyValidator], updateCurrencyFn)
    app.get("/currency", [adminAuthorization], CurrencyListFn)
    app.get("/currency/:currency_id", [adminAuthorization], CurrencyDetailFn)
    app.patch("/currency/:currency_id", [adminAuthorization], CurrencyStatusUpdateFn)
    app.delete("/currency/:currency_id", [adminAuthorization], CurrencyDeleteFn)
};
