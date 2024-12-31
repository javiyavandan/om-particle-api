import {
    fieldBitChain,
  fieldFloatChain,
  fieldIntegerChain,
  fieldStringChain,
  phoneNumberChain,
} from "../common-validation-rules";

export const diamondConciergeRules = [
  fieldStringChain("Name", "name"),
  fieldStringChain("Message", "message"),
  fieldStringChain("Email Id", "email"),
  phoneNumberChain("phone_number"),
  fieldIntegerChain("Shape", "shape"),
  fieldIntegerChain("Color", "color"),
  fieldIntegerChain("Clarity", "clarity"),
  fieldFloatChain("Weight", "weight"),
  fieldFloatChain("Measurement", "measurement"),
  fieldIntegerChain("No of stones", "no_of_stones"),
  fieldBitChain("Certificate", "certificate")
];
