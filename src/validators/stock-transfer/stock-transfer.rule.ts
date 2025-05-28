import { checkObjectNotRequired, fieldIntegerChain, fieldUniqueValueKeyArrayChain } from "../common-validation-rules";

export const addStockTransferRules = [
    fieldIntegerChain("Receiver", "receiver"),
    checkObjectNotRequired("consignment_details", [
        "delivery_challan_no",
        "pre_carriage",
        "vessels_flight_no",
        "hsn_code",
        "description",
        "diamond_description",
        "consignment_remarks",
    ]),
    fieldUniqueValueKeyArrayChain("Stock", "stock_list", 1, "stock_id"),
]

export const returnStockTransferRules = [
    checkObjectNotRequired("consignment_details", [
        "delivery_challan_no",
        "pre_carriage",
        "vessels_flight_no",
        "hsn_code",
        "description",
        "diamond_description",
        "consignment_remarks",
    ]),
    fieldUniqueValueKeyArrayChain("Stock", "stock_list", 1, "stock_id"),   
]