import { fieldIntegerChain, fieldStringChain, fieldUniqueValueKeyArrayChain } from "../common-validation-rules";

export const addStockTransferRules = [
    fieldIntegerChain("Receiver", "receiver"),
    fieldIntegerChain("Sender", "sender"),
    fieldStringChain("Delivery Challan No", "delivery_challan_no"),
    fieldStringChain("Pre Carriage", "pre_carriage"),
    fieldStringChain("Vessels Name Or Flight Number", "vessels_flight_no"),
    fieldStringChain("HSN code", "hsn_code"),
    fieldStringChain("Description", "description"),
    fieldStringChain("Diamond Description", "diamond_description"),
    fieldStringChain("Consignment Remarks", "consignment_remarks"),
    fieldUniqueValueKeyArrayChain("Stock", "stock_list", 1, "stock_id"),
]