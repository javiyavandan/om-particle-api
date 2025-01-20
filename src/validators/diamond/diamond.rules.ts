import { fieldArrayChain } from "../common-validation-rules";

export const comparedDiamondsRules = [
  fieldArrayChain("Product Id", "product_id"),
];
