import { emailChain, fieldIntegerChain, fieldStringChain, phoneNumberChain } from "../common-validation-rules";

export const singleProductInquiryValidatorRule = [
    fieldStringChain("Name", "name"),
    emailChain("Email", "email"),
    phoneNumberChain("phone_number"),
    fieldStringChain("Message", "message"),
    fieldIntegerChain("Product", "product_id")
]