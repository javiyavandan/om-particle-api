import {
  File_type,
  FILE_TYPE,
  HTTP_METHODS,
  Image_type,
  UserType,
  VehicleCategory,
  VehicleColor,
  VehicleSeat,
  vehicleStatus,
} from "./app-enumeration";

// Region REQUEST RESPONSE CODER
export const SIGNATURE_ALGORITHM = "sha1WithRSAEncryption";

export const CIPHER_ALGORITHM = "aes-128-cbc";

export const PUBLIC_KEY = "PUBLIC_KEY";
export const PRIVATE_KEY = "PRIVATE_KEY";
// End Region

// Region JWT
export const JWT_SECRET_KEY = "JWT_SECRET_KEY";

export const USER_JWT_EXPIRATION_TIME = {
  [UserType.Admin]: { tokenTime: 86400, refreshTokenTime: 86400 * 2 },
  [UserType.Customer]: { tokenTime: 86400, refreshTokenTime: 86400 * 2 },
};

export const RESET_JWT_TOKEN_EXPRATION_TIME = 3000;

// bulk upload range
export const BULK_UPLOAD_DATA_RANG = 100;
export const JWT_EXPIRED_ERROR_NAME = "TokenExpiredError";
export const JWT_EXPIRED_ERROR_MESSAGES = {
  invalidToken: "invalid token",
  jwtMalformed: "jwt malformed",
  jwtSignatureIsRequired: "jwt signature is required",
  jwtAudienceInvalid: "jwt audience invalid",
  jwtIssuerInvalid: "jwt issuer invalid",
  jwtIdInvalid: "jwt id invalid",
  jwtSubjectInvalid: "jwt subject invalid",
};
// End Region

// MASTER
export const MasterError = {
  metal_master: "Metal",
  metal_tone_master: "Metal tone",
  metal_karat_master: "Metal karat",
  stone_master: "Stone",
  stone_carat_master: "Stone carat",
  stone_shape_master: "Stone shape",
  diamond_color_master: "Diamond color",
  diamond_clarity_master: "Diamond clarity",
  diamond_cut_master: "Diamond cut",
  diamond_certificate_master: "Diamond certificate",
  diamond_process_master: "Diamond Process",
  item_size_master: "Item size",
  item_length_master: "Item length",
  setting_style_master: "Setting style",
  category_master: "Category",
  tag_master: "Tag",
  brand_master: "Brand",
  select_preference_master: "Select Preference",
  availability_master: "availability",
  cut_grade_master: "cut grade",
  polish_master: "polish",
  symmetry_master: "symmetry",
  fluorescence_intensity_master: "fluorescence intensity",
  fluorescence_color_master: "fluorescence color",
  fluorescence_master: "Fluorescence",
  lab_master: "lab",
  fancy_color_master: "fancy color",
  color_intensity_master : "Color intensity master",
  fancy_color_intensity_master: "fancy color intensity",
  fancy_color_overtone_master: "fancy color overtone",
  girdle_thin_master: "girdle thin",
  girdle_thick_master: "girdle thick",
  girdle_condition_master: "girdle condition",
  culet_condition_master: "culet condition",
  laser_inscription_master: "laser inscription",
  cert_comment_master: "cert comment",
  country: "country",
  state: "state",
  city: "city",
  time_to_location_master: "time to location",
  pair_separable_master: "pair separable",
  pair_stock_master: "pair stock",
  parcel_stones_master: "parcel stones",
  trade_show_master: "trade show",
  shade_master: "shade",
  center_inclusion_master: "center inclusion",
  black_inclusion_master: "black inclusion",
  report_type_master: "report type",
  lab_location_master: "lab location",
  milky_master: "milky",
  bgm_master: "bgm",
  pair_master: "pair",
  "H&A_master": "H&A",
  growth_type_master: "growth type",
};

export const PASSWORD_SOLT = 10;
export const OTP_GENERATE_NUMBERS = "0123456789";
export const STATIC_OTP = "123456";

export const PASSWORD_REGEX =
  /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&])[a-zA-Z0-9@$!%*#?&]+/g;

export const PHONE_NUMBER_REGEX =
  /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;

export const USER_TYPE_LIST = Object.keys(UserType)
  .filter((key) => isNaN(Number(key)))
  .map((key) => UserType[key as keyof typeof UserType]);

export const VEHICLE_CATEGORY_LIST = Object.keys(VehicleCategory)
  .filter((key) => isNaN(Number(key)))
  .map((key) => VehicleCategory[key as keyof typeof VehicleCategory]);

export const VEHICLE_COLOR_LIST = Object.keys(VehicleColor)
  .filter((key) => isNaN(Number(key)))
  .map((key) => VehicleColor[key as keyof typeof VehicleColor]);

export const VEHICLE_SEAT_LIST = Object.keys(VehicleSeat)
  .filter((key) => isNaN(Number(key)))
  .map((key) => VehicleSeat[key as keyof typeof VehicleSeat]);

export const VEHICLE_STATUS_LIST = Object.keys(vehicleStatus)
  .filter((key) => isNaN(Number(key)))
  .map((key) => vehicleStatus[key as keyof typeof vehicleStatus]);

export const BIT_FIELD_VALUES = ["0", "1"];

export const PER_PAGE_ROWS = 10;
export const PRODUCT_PER_PAGE_ROWS = 20;
// Invoice

export const INVOICE_NUMBER_DIGIT = 6;

// hub sport api url

export const HUB_SPOT_API_URL = {
  getCompany: "/crm/v3/objects/companies/search",
  createCompany: "/crm/v3/objects/companies",
  updateCompany: "/crm/v3/objects/companies/{{ID}}",

  getContact: "/crm/v3/objects/contacts/search",
  createContact: "/crm/v3/objects/contacts",
  updateContact: "/crm/v3/objects/contacts/{{ID}}",

  getDeal: "/crm/v3/objects/deals/search",
  createDeal: "/crm/v3/objects/deals",
  updateDeal: "/crm/v3/objects/deals/{{ID}}",

  getDealItems: "/crm/v3/objects/line_items/search",
  createDealItems: "/crm/v3/objects/line_items/batch/create",
  updateDealItems: "/crm/v3/objects/line_items/{{ID}}",
};

export const IMAGE_TYPE_LOCATION = {
  [Image_type.HomePage]: "images/banners",
  [Image_type.About]: "images/aboutUs",
  [Image_type.Masters]: "images/masters",
  [Image_type.Preference]: "images/preference",
  [Image_type.User]: "images/user",
  [Image_type.Concierge]: "images/concierge",
  [Image_type.Popup]: "images/popup",
  [File_type.Customer]: 'files/customer'
};
// Product Bulk Upload File
export const PRODUCT_BULK_UPLOAD_FILE_MIMETYPE =
  process.env.PRODUCT_BULK_UPLOAD_FILE_MIMETYPE ||
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const PRODUCT_BULK_UPLOAD_ZIP_MIMETYPE =
  process.env.PRODUCT_BULK_UPLOAD_ZIP_MIMETYPE ||
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const PRODUCT_BULK_UPLOAD_FILE_SIZE = process.env
  .PRODUCT_BULK_UPLOAD_FILE_SIZE
  ? Number(process.env.PRODUCT_BULK_UPLOAD_FILE_SIZE)
  : 10;
export const PRODUCT_BULK_UPLOAD_ZIP_SIZE = process.env
  .PRODUCT_BULK_UPLOAD_ZIP_SIZE
  ? Number(process.env.PRODUCT_BULK_UPLOAD_ZIP_SIZE)
  : 10;
export const PRODUCT_BULK_UPLOAD_BATCH_SIZE =
  process.env.PRODUCT_BULK_UPLOAD_BATCH_SIZE || 500;

export const COLOR_LENGTH = 2;
export const SIMILAR_PRODUCT_LIMIT = 10;

export const FilterOrder = {
  sort_by: "order_by",
  order_by: "ASC",
};

export const LatestOrder = {
  limit: 5,
  sort_by: "order_date",
  order_by: "DESC",
};
export const NAME_LENGTH_MIN = 3;
export const NAME_LENGTH_MAX = 30;

export const ROLE_NAME_LENGTH_MIN = 2;
export const ROLE_NAME_LENGTH_MAX = 50;

export const BUSINESS_USER_NAME_LENGTH_MIN = 2;
export const BUSINESS_USER_NAME_LENGTH_MAX = 50;

export const EMAIL_LENGTH_MIN = 3;
export const EMAIL_LENGTH_MAX = 200;

export const PHONE_NUMBER_LENGTH_MIN = 4;
export const PHONE_NUMBER_LENGTH_MAX = 20;

export const PINCODE_MIN_NUMBER_LENGTH = 5;
export const PINCODE_MAX_NUMBER_LENGTH = 6;
export const GET_HTTP_METHODS_LABEL = {
  [HTTP_METHODS.Get]: "GET",
  [HTTP_METHODS.Post]: "POST",
  [HTTP_METHODS.Put]: "PUT",
  [HTTP_METHODS.Delete]: "DELETE",
  [HTTP_METHODS.Patch]: "PATCH",
};

export const BASE_MASTER_URL = "master";
