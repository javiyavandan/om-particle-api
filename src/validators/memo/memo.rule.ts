import { fieldArrayChain, fieldIntegerChain, fieldStringChain } from "../common-validation-rules";

export const memoRules = [
    fieldIntegerChain("Customer", "customer_id"),
    fieldArrayChain("Stock", "stock_list"),
    fieldStringChain("Contact", "contact"),
    fieldStringChain("Ship Via", "ship_via"),
    fieldStringChain("Salesperson", "salesperson"),
    fieldStringChain("Report Date", "report_date"),
]