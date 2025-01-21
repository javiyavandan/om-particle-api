import { fieldIntegerChain, fieldStringChain, fieldStringNotReqChain, phoneNumberChain } from "../common-validation-rules";

export const companyValidatorRule = [
    fieldStringChain("Name", "name"),
    fieldStringChain("registration number", "registration_number"),
    fieldIntegerChain("country", "country_id"),
    fieldIntegerChain("account number", "ac_number"),
    fieldStringChain("account holder name", "ac_holder"),
    fieldStringChain("bank name", "bank_name"),
    fieldStringNotReqChain("bank branch", "bank_branch"),
    fieldStringNotReqChain("Contact person", "contact_person"),
    fieldStringChain("bank branch code", "bank_branch_code"),
    fieldStringChain("company_address", "company_address"),
    fieldStringChain("city", "city"),
    fieldStringChain("pincode", "pincode"),
    fieldStringChain("email", "email"),
    fieldStringChain("state", "state"),
    fieldStringNotReqChain("map link", "map_link"),
    phoneNumberChain("phone_number"),
]