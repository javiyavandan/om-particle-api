import { fieldArrayChain, fieldIntegerChain } from "../common-validation-rules";

export const memoRules = [
    fieldIntegerChain("Customer", "customer_id"),
    fieldArrayChain("Stock", "stock_list"),
]