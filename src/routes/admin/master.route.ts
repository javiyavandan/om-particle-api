import { Router } from "express";
import { adminAuthorization } from "../../middlewares/authenticate";
import { addMasterFn,categoryListFn,masterDeleteFn, masterDetailFn, masterListFn, masterStatusUpdateFn, preferenceListFn, subCategoryListFn, updateMasterFn} from "../../controllers/admin/master.controller";
import { masterValidator } from "../../validators/master/master.validator";
import { reqSingleImageParser } from "../../middlewares/multipart-file-parser";

export default (app: Router) => {
  // ::::::::::---------:::::=== Metal Master Route ===:::::---------:::::::::: //
  app.post("/master", [ reqSingleImageParser("image"), adminAuthorization, masterValidator], addMasterFn);
  app.put("/master/:id", [ reqSingleImageParser("image"), adminAuthorization, masterValidator], updateMasterFn)
  app.get("/masters/:master_type", [adminAuthorization], masterListFn)
  app.get("/master/:id/:master_type", [adminAuthorization], masterDetailFn)
  app.patch("/master/:id/:master_type", [adminAuthorization], masterStatusUpdateFn)
  app.delete("/master/:id/:master_type", [adminAuthorization], masterDeleteFn)
  app.get("/categories", [adminAuthorization], categoryListFn)
  app.get("/category/:id_parent", [adminAuthorization], subCategoryListFn)
  app.get("/preferences", [adminAuthorization], preferenceListFn)
};
