import { emailChain, fieldArrayChain, fieldIntegerChain, fieldStringChain, fieldStringNotReqChain, phoneNumberChain } from "../common-validation-rules";

export const singleProductInquiryValidatorRule = [
    fieldStringChain("Full Name", "full_name"),
    emailChain("Email", "email"),
    phoneNumberChain("phone_number"),
    fieldStringChain("Message", "message"),
    fieldIntegerChain("Product", "product_id")
]

export const inquiryRules = [
    emailChain("Email", "email"),
    fieldStringNotReqChain("Inquiry Note", "inquiry_note")
]