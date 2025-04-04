import { fieldArrayChain, fieldFloatNotReqChain, fieldIntegerChain, fieldStringChain, fieldStringNotReqChain } from "../common-validation-rules";

export const invoiceRules = [
    fieldIntegerChain("Customer", "customer_id"),
    fieldArrayChain("Stock", "stock_list"),
    fieldStringNotReqChain("Customer Order", "cust_order"),
    fieldStringNotReqChain("Tracking", "tracking"),
    fieldFloatNotReqChain("Shipping charge", "shipping_charge"),
    fieldFloatNotReqChain("Discount", "discount"),
    fieldStringNotReqChain("Discount Type", "discount_type"),
]