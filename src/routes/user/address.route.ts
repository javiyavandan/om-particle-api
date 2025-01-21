import { Router } from "express";
import { addAddressFn, deleteAddressFn, getAllAddressFn, updateAddressFn } from "../../controllers/user/address.controller";
import { addAddressValidator, updateAddressValidator } from "../../validators/address/address.validator";
import { customerAuthorization } from "../../middlewares/authenticate";

export default (app: Router) => {
    app.post("/address", [customerAuthorization,addAddressValidator], addAddressFn)
    app.put("/address/:address_id", [customerAuthorization,updateAddressValidator], updateAddressFn)
    app.delete("/address/:address_id", [customerAuthorization], deleteAddressFn)
    app.get("/address", [customerAuthorization], getAllAddressFn)
}