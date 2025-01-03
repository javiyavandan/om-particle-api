import { fieldArrayChain, fieldIntegerChain } from "../common-validation-rules";

export const memoRules = [
    fieldIntegerChain("Company", "company_id"),
    fieldIntegerChain("Customer", "customer_id"),
    fieldArrayChain("Stock", "stock_list"),
]