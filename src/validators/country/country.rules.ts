import { fieldStringChain } from "../common-validation-rules";

export const countryValidatorRule = [
    fieldStringChain("Name", "name"),
    fieldStringChain("Country Code", "code"),
]