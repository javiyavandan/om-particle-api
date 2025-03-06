import { fieldArrayChain, fieldIntegerChain, fieldStringChain, fieldStringNotReqChain } from "../common-validation-rules";

export const memoRules = [
    fieldIntegerChain("Customer", "customer_id"),
    fieldArrayChain("Stock", "stock_list"),
    fieldStringNotReqChain("Customer Order", "cust_order"),
    fieldStringNotReqChain("Tracking", "tracking"),
]