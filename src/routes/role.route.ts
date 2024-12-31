import { Router } from "express";
import {
  addRoleConfigurationFn,
  addRoleFn,
  deleteRoleFn,
  fetchRoleConfigurationFn,
  getUserAccessMenuItemsFn,
  getAllActionsFn,
  getAllMenuItemsFn,
  getAllRolesFn,
  updateRoleConfigurationFn,
  updateRoleFn,
  addMenuItemsFn,
  addPermissionFn,
} from "../controllers/role.controller";
import {
  addUpdateRoleConfigurationValidator,
  addRoleValidator,
  updateRoleValidator,
} from "../validators/role/role.validator";
import { adminAuthorization } from "../middlewares/authenticate";

export default (app: Router) => {
  app.get("/roles", [adminAuthorization], getAllRolesFn);
  app.post("/roles", [adminAuthorization, addRoleValidator], addRoleFn);
  app.put(
    "/roles/:id",
    [adminAuthorization, updateRoleValidator],
    updateRoleFn
  );
  app.delete("/roles/:id", [adminAuthorization], deleteRoleFn);
  app.get("/actions", [adminAuthorization], getAllActionsFn);
  app.get("/menu-items", getAllMenuItemsFn);
  app.get(
    "/role-configuration/:id",
    [adminAuthorization],
    fetchRoleConfigurationFn
  );
  app.post(
    "/role-configuration",
    [adminAuthorization, addUpdateRoleConfigurationValidator],
    addRoleConfigurationFn
  );
  app.put(
    "/role-configuration/:id",
    [adminAuthorization, addUpdateRoleConfigurationValidator],
    updateRoleConfigurationFn
  );
  app.get("/user-access-menu-items", [], getUserAccessMenuItemsFn);
  app.post("/menu-items", addMenuItemsFn);
  app.post("/addPermission", addPermissionFn);
};
