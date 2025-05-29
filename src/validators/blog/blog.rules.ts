import { fieldIntegerChain, fieldIntegerNotReqChain, fieldStringChain, fieldStringNotReqChain } from "../common-validation-rules";

export const blogCategoryRules = [
    fieldStringChain("Name", "name"),
    fieldIntegerChain("Sort Order", "sort_order"),
]

export const blogRules = [
    fieldStringChain("Title", "title"),
    fieldStringChain("Description", "description"),
    fieldStringChain("author", "author"),
    fieldIntegerChain("Sort Order", "sort_order"),
    fieldStringNotReqChain("Sort Description", "sort_description"),
    fieldStringNotReqChain("Meta Description", "meta_description"),
    fieldStringNotReqChain("Meta Title", "meta_title"),
    fieldStringNotReqChain("Meta Keywords", "meta_keywords"),
    fieldIntegerNotReqChain("Category Id", "id_category"),
]