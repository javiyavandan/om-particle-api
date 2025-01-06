import {
  fieldIntegerChain,
  fieldIntegerNotReqChain,
  fieldTypeCheckChain,
} from "../common-validation-rules";

export const addcartProductRule = [
  fieldIntegerChain("Product ID", "product_id"),
  fieldIntegerNotReqChain("Quantity", "quantity"),
];
