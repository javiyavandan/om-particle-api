import { fieldIntegerChain, fieldUniqueValueArrayChain, fieldUniqueValueKeyArrayChain } from "../common-validation-rules";

export const createApiRules = [
    fieldIntegerChain("Company", "company_id"),
    fieldIntegerChain("Customer", "customer_id"),
    fieldUniqueValueArrayChain("Column", "column_array", 1),
    fieldUniqueValueKeyArrayChain("Stock", "stock_list", 1, "stock_id"),
]

export const updateApiRules = [
    fieldUniqueValueArrayChain("Column", "column_array", 1),
    fieldUniqueValueArrayChain("Remove", "remove_list", 0),
    fieldUniqueValueKeyArrayChain("Stock", "stock_list", 1, "stock_id"),
]