import {
  fieldIntegerNotReqChain,
  fieldStringChain,
  fieldStringNotReqChain,
} from "../common-validation-rules";

export const masterValidatorRule = [
  fieldStringChain("Name", "name"),
  fieldStringNotReqChain("Sort-Code", "sort_code"),
  fieldStringNotReqChain("Import Name", "import_name"),
  fieldStringNotReqChain("Value", "value"),
  fieldStringNotReqChain("stone type", "stone_type"),
  fieldStringNotReqChain("link", "link"),
  fieldIntegerNotReqChain("Order", "order")
];
