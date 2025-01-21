import { fieldStringChain } from "../common-validation-rules";

export const currencyValidatorRule = [
    fieldStringChain("Name", "name"),
    fieldStringChain("code", "code"),
    fieldStringChain("format", "format"),
    fieldStringChain("symbol", "symbol"),
    fieldStringChain("is_default", "is_default"),
]