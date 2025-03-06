import { fieldArrayChain, fieldIntegerChain, fieldStringChain, fieldStringNotReqChain } from "../common-validation-rules";

export const invoiceRules = [
    fieldIntegerChain("Customer", "customer_id"),
    fieldArrayChain("Stock", "stock_list"),
    fieldStringNotReqChain("Customer Order", "cust_order"),
    fieldStringNotReqChain("Tracking", "tracking"),
]