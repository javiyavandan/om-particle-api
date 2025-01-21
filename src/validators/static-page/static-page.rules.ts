import { fieldStringChain } from "../common-validation-rules";

export const staticPageValidatorRule = [
    fieldStringChain("Name", "name"),
    fieldStringChain("Slug", "slug"),
    fieldStringChain("Description", "description"),
]