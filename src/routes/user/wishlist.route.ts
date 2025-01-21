import { Router } from "express";
import { customerAuthorization } from "../../middlewares/authenticate";
import {
  createFolderFn,
  folderListFn,
  wishlistAddFn,
  wishlistDeleteFn,
  wishlistFn,
} from "../../controllers/user/wishlist.controller";
import { folderValidator, wishlistValidator } from "../../validators/wishlist/wishlist.validator";

export default (app: Router) => {
  app.post("/wishlist", [customerAuthorization, wishlistValidator], wishlistAddFn);
  app.get("/wishlist", [customerAuthorization], wishlistFn);
  app.get("/wishlist/folders", [customerAuthorization], folderListFn);
  app.post("/wishlist-folder/add", [customerAuthorization, folderValidator], createFolderFn);
  app.delete("/wishlist/:folder_id/:wishlist_id", [customerAuthorization], wishlistDeleteFn);
};
