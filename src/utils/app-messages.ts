import {
    PRODUCT_BULK_UPLOAD_BATCH_SIZE,
    PRODUCT_BULK_UPLOAD_FILE_MIMETYPE,
    PRODUCT_BULK_UPLOAD_FILE_SIZE,
  } from "./app-constants";
  
  export const DEFAULT_STATUS_CODE_SUCCESS = 200;
  export const DEFAULT_STATUS_CODE_SUCCESS_BUT_NO_CONTENT = 201;
  export const DEFAULT_STATUS_SUCCESS = "success";
  
  export const DEFAULT_STATUS_CODE_ERROR = 500;
  export const DEFAULT_STATUS_ERROR = "error";
  export const UNKNOWN_ERROR_TRY_AGAIN =
    "An unknown error occurred! Please try again.";
  
  export const BAD_REQUEST_CODE = 400;
  export const BAD_REQUEST_MESSAGE = "Bad request!";
  export const FORBIDDEN_CODE = 403;
  
  export const UNAUTHORIZED_ACCESS_CODE = 401;
  export const UNAUTHORIZED_ACCESS_MESSAGE = "Unauthorized Access!";
  
  export const DUPLICATE_ERROR_CODE = 409;
  
  export const NOT_FOUND_CODE = 404;
  export const NOT_FOUND_MESSAGE = "Not found!";
  export const DATA_ALREADY_EXITS = "<<field_name>> already exists!";
  
  export const REQUIRED_ERROR_MESSAGE = "<<field_name>> is required!";
  
  export const RECORD_DELETED = "Record deleted successfully";
  export const STATUS_UPDATED = "Status Updated";
  export const INVALID_OTP = "Invalid OTP!";
  export const INVALID_ERROR_MESSAGE = "Invalid <<field_name>> type!";
  export const ERROR_NOT_FOUND = "<<field_name>> not found!";
  export const TYPE_NON_EMPTY_STRING_ERROR_MESSAGE =
    "<<field_name>> must be a non empty string!";
  export const MIN_MAX_LENGTH_ERROR_MESSAGE =
    "<<field_name>> must be a <<min>> to <<max>> characters!";
  export const TYPE_INTEGER_ERROR_MESSAGE = "<<field_name>> must be an integer!";
  export const TYPE_DECIMAL_ERROR_MESSAGE =
    "<<field_name>> must be a decimal number!";
  export const TYPE_MIN_MAX_FLOAT_ERROR_MESSAGE =
    "<<field_name>> must be a float number between <<min>> and <<max>>!";
  export const TYPE_ARRAY_ERROR_MESSAGE = "<<field_name>> must be an array!";
  export const TYPE_ARRAY_NON_EMPTY_ERROR_MESSAGE =
    "<<field_name>> must be an empty array!";
  export const TYPE_BIT_ERROR_MESSAGE =
    "<<field_name>> must be a '0' and '1' string!";
  export const DUPLICATE_VALUE_ERROR_MESSAGE = "Duplicate <<field_name>> found!";
  export const URL_TYPE_VALIDATION_MESSAGE =
    "<<field_name>> field should be a type of url";
  
  export const USER_NOT_FOUND = "User not found!";
  export const USER_NOT_VERIFIED = "User is not verified please contact admin!";
  export const VERIFIED = "<<field_name>> is verified!";
  export const UPDATE = "<<field_name>> is updated!";
  export const INVALID_USERNAME_PASSWORD = "Invalid username or password!";
  export const AUTHORIZATION_TOKEN_IS_REQUIRED =
    "Authorization token is required!";
  export const TOKEN_EXPIRED = "Authorization token expired";
  export const NOT_VERIFIED = "Not verified";
  export const ACCOUNT_NOT_VERIFIED = "Account is not verified!";
  
  export const PASSWORD_IS_REQUIRED = "Password is required!";
  export const PASSWORD_TYPE_NON_EMPTY_STRING =
    "Password must be a non empty string!";
  export const INVALID_PASSWORD =
    "Password should be a combination of one uppercase , one lowercase, one special character, one digit, and a minimum of 8 !";
  export const CONFIRM_PASSWORD_IS_REQUIRED = "Confirm password is required!";
  export const PASSWORD_MUST_BE_SAME = "Passwords must be the same!";
  export const PASSWORD_IS_WRONG = "Password is wrong!";
  
  export const INVALID_PHONE_NUMBER =
    "Phone number should be a combination of country code (+1) !";
  export const INVALID_EMAIL = "Email is invalid!";
  export const FORGOT_PASSWORD = "Link for reset password is sent to your email!";
  
  // BANNER MASTER
  export const TITLE_IS_REQUIRED = "Title is required!";
  export const TITLE_IS_NON_EMPTY_STRING = "Title must be a non empty string!";
  export const CONTENT_REQUIRED = "Content is required!";
  export const CONTENT_IS_NON_EMPTY_STRING =
    "Content must be a non empty string!";
  export const IMAGE_REQUIRED = "Image is required!";
  export const BUTTON_NAME_REQUIRED = "Button name is required!";
  export const BUTTON_NAME_IS_NON_EMPTY_STRING =
    "Button name must be a non empty string!";
  export const LINK_REQUIRED = "Link is required!";
  export const LINK_IS_NON_EMPTY_STRING = "Link must be a non empty string!";
  
  // AUTH MESSAGE
  export const OTP_SENT = "OTP is send to your email";
  export const OTP_RESEND = "otp is resend";
  export const PASSWORD_CHANGED = "password is changed";
  export const EMAIL_REQUIRED = "Email is required!";
  export const PHONE_NUMBER_REQUIRED = "Phone number is required!";
  export const FIRST_NAME_REQUIRED = "First name is required!";
  export const LAST_NAME_REQUIRED = "Last name is required!";
  export const COMPANY_NAME_REQUIRED = "Company name is required!";
  export const COMPANY_WEBSITE_REQUIRED = "Company website is required!";
  export const ABN_NUMBER_REQUIRED = "ABN number is required!";
  export const ADDRESS_REQUIRED = "Address is required!";
  export const CITY_REQUIRED = "City is required!";
  export const STATE_REQUIRED = "State is required!";
  export const COUNTRY_REQUIRED = "Country is required!";
  export const POSTCODE_REQUIRED = "Postcode is required!";
  export const OTP_REQUIRED = "OTP is required!";
  export const USER_ID_REQUIRED = "User id is required!";
  export const OLD_PASSWORD_REQUIRED = "Old Password is required!";
  export const NEW_PASSWORD_REQUIRED = "New Password is required!";
  export const INVALID_ID = "Id is invalid!";
  export const ORDER_NOT_FOUND = "Order not found!";
  export const ORDER_NUMBER_IS_INVALID = "Order Number is invalid!";
  export const ORDER_AMOUNT_WRONG = "Order Amount is wrong!";
  export const INVOICE_NOT_FOUND = "Invoice Not Found!";
  export const TOTAL_AMOUNT_WRONG = " Total amount is Wrong!";
  export const UNPROCESSABLE_ENTITY_CODE = 422;
  export const UNPROCESSABLE_ENTITY_MESSAGE = "Unprocessable Entity!";
  export const TRANSACTION_FAILED_MESSAGE = "Transaction Failed!...";
  export const RESOURCE_NOT_FOUND = "Resource not found!";
  
  export const PRODUCT_BULK_UPLOAD_FILE_MIMETYPE_ERROR_MESSAGE = `File must be a ${PRODUCT_BULK_UPLOAD_FILE_MIMETYPE}`;
  export const PRODUCT_BULK_UPLOAD_FILE_SIZE_ERROR_MESSAGE = `File size must be less than ${PRODUCT_BULK_UPLOAD_FILE_SIZE}MB`;
  export const PRODUCT_BULK_UPLOAD_BATCH_SIZE_ERROR_MESSAGE = `Batch size must be less than or equal to ${PRODUCT_BULK_UPLOAD_BATCH_SIZE}`;
  export const FILE_NOT_FOUND = "File not found!";
  export const INVALID_HEADER = "Invalid header!";
  
  export const ACCESS_NOT_FOUND = "Access not found!";
  export const HTTP_METHOD_NOT_FOUND = "Http method not found!";
  export const ROLE_API_PERMISSION_NOT_FOUND = "Role API permission not found!";
  export const ID_MENU_ITEM_REQUIRED = "The ID menu item field is required!";
  export const ID_MENU_ITEM_TYPE_INTEGER = "Id menu item should be an integer!";
  
  export const ACCESS_REQUIRED = "Access field is required!";
  export const ACCESS_TYPE_ARRAY = "Access field should be an array!";
  export const ACCESS_ARRAY_VALUE_TYPE_INTEGER =
    "Access array value should be an integer!";
  
  export const ID_MENU_ITEM_UNIQUE =
    "ID menu item value should be unique in array!";
  export const ACCESS_ARRAY_VALUE_UNIQUE = "ID menu item should be unique!";
  
  export const MENU_ITEM_NOT_FOUND = "Menu item not found!.";
  export const ROLE_NOT_FOUND = "Role not found!";
  export const ROLE_WITH_SAME_NAME_AVAILABLE =
    "The role can not be <<action>>! because the role already exists with the same name.";
  export const USER_WITH_ROLE_AVAILABLE =
    "The role can not be deleted! because some users are available in the system with a given role.";
  export const IS_ACTIVE_REQUIRED = "Is active field required!";
  export const IS_ACTIVE_EXPECTED_TYPE_STRING =
    "Is active must be a '0' and '1' string!";
  
  export const ONLY_AI_EXPECTED_TYPE_STRING =
    "Only active and inactive strings must be a '0' and '1' string!";
  
  export const DATE_TYPE_VALIDATION_MESSAGE = "Invalid value for date type!";
  export const ROLE_NAME_IS_NON_EMPTY_STRING =
    "Role name must be a non empty string!";
  export const ROLE_NAME_LENGTH_MIN_MAX = "Role name must be 2 to 50 characters!";
  export const VALUE_IS_REQUIRED = "value is required!";
  export const VALUE_IS_NON_EMPTY = "value must be non-empty!";
  export const ROLE_NAME_IS_REQUIRED = "Role name is required!";
  export const ROLE_PERMISSION_ACCESS_REQUIRED =
    "The role permission access field is required!";
  export const ROLE_PERMISSION_ACCESS_TYPE_ARRAY =
    "Role permission access should be an array!";
  export const BUSINESS_USER_NAME_LENGTH_MIN_MAX =
    "Name must be 2 to 100 characters!";
  export const EMAIL_IS_REQUIRED = "Email is required!";
  export const EMAIL_LENGTH_MIN_MAX = "Email must be a 3 to 200 characters!";
  export const EMAIL_IS_ALL_READY_IN_SUBSCRIPTION_LIST =
    "Email is already on our subscription list.";
  export const SUCCESS_SUBSCRIPTION_LIST =
    "You have successfully subscribed for our newsletter.";
  export const SUBSCRIPTION_NOT_FOUND =
    "Email doesn't exist in our subscription list.";
  export const ID_ROLE_IS_REQUIRED = "Role id is required!";
  export const ID_ROLE_INVALID_TYPE = "Role id must be an integer";
  export const NAME_IS_REQUIRED = "Name is required!";
  export const NAME_IS_NON_EMPTY_STRING = "Name must be a non empty string!";
  export const NAME_LENGTH_MIN_MAX = "Name must be 3 to 30 characters!";
  export const PHONE_NUMBER_IS_REQUIRED = "Phone number is required!";
  export const PHONE_NUMBER_IS_NON_EMPTY_STRING =
    "Phone number must be a non empty string!";
  export const PHONE_NUMBER_LENGTH_MIN_MAX =
    "Phone number must be a 4 to 20 characters!";
  export const EMAIL_ALL_READY_EXIST = "User is already exists with the same email!";
  export const INVALID_OLD_PASSWORD = "Invalid old password!";
  