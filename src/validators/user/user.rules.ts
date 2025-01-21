import {
    emailChain,
    fieldStringChain,
    phoneNumberChain,
  } from "../common-validation-rules";
  
  export const contactUsRules = [
    fieldStringChain("Name", "name"),
    emailChain("Email Id", "email"),
    phoneNumberChain("phone_number"),
    fieldStringChain("Message", "message")
  ];
  