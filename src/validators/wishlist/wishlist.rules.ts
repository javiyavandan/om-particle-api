import {
  fieldArrayChain,
  fieldIntegerChain,
  fieldStringChain,
} from "../common-validation-rules";

export const wishlistRules = [
  fieldArrayChain("Product details", "product_details"),
  fieldIntegerChain("Folder Id", "folder_id"),
  fieldStringChain("Folder Name", "folder_name")
];

export const folderRules = [
  fieldStringChain("Name", "name")
]