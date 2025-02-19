import { fieldArrayChain, fieldIntegerChain, fieldStringChain } from "../common-validation-rules";

export const invoiceRules = [
    fieldIntegerChain("Customer", "customer_id"),
    fieldArrayChain("Stock", "stock_list"),
]