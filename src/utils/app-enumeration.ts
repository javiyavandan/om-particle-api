export enum UserType {
  Admin = "admin",
  Customer = "customer_user",
}

export enum StockStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  MEMO = 'memo',
}

export enum AffiliateStatus {
  Padding = 0,
  Active = 1,
  Inactive = 2
}
export enum MESSAGE_TYPE {
  Credential = 1,
  Otp = 2,
  Registration = 3,
  NewOrder = 4,
  ProductInquiry = 5,
  ContactUs = 6,
  JewelryConcierge = 7,
  DiamondConcierge = 8,
  UserVerify = 9,
}

export enum DefaultStatus {
  True = "1",
  False = "0",
}

export enum DeleteStatus {
  Yes = '1',
  No = '0',
}

export enum ActiveStatus {
  Active = "1",
  InActive = "0",
}

export enum Image_type {
  Banner = 1,
  Masters = 2,
  User = 3,
  Concierge = 4,
  About = 5,
  Preference = 6,
  Popup = 7,
}

export enum HUBSPOT_ASSOCIATION {
  ContactToCompany = 1,
  DealsToCompany = 5,
  DealsToItems = 20,
}

export enum UserVerification {
  User_Verified = "user_verified",
  Admin_Verified = "admin_verified",
  NotVerified = "not_verified",
}

export enum UserListType {
  Approved = "approved",
  Pending = "pending",
}


export enum VehicleCategory {
  CharterBus = 1,
  Minibus = 2,
  Sprinter_van = 3,
  Limousine = 4,
  PartyBus = 5,
  SpecialityVehicle = 6
}

export enum VehicleColor {
  Yellow = 1,
  Black = 2,
  Red = 3 
}

export enum VehicleSeat {
  Leather = 1,
  Cloth = 2
}

export enum vehicleStatus {
  available = 1,
  unavailable = 0
}

export enum Master_type {
  Metal = "metal_master",
  Metal_tone = "metal_tone_master",
  Metal_karat = "metal_karat_master",
  Stone = "stone_master",
  Stone_carat = "stone_carat_master",
  Stone_shape = "stone_shape_master",
  Diamond_color = "diamond_color_master",
  Diamond_clarity = "diamond_clarity_master",
  Diamond_cut = "diamond_cut_master",
  Diamond_certificate = "diamond_certificate_master",
  Diamond_process = "diamond_process_master",
  Item_size = "item_size_master",
  Category_master = "category_master",
  Item_length = "item_length_master",
  Setting_style = "setting_style_master",
  Tag = "tag_master",
  Brand = "brand_master",
  Preference = "select_preference_master",
  Availability = "availability_master",
  CutGrade = "cut_grade_master",
  Polish = "polish_master",
  symmetry = "symmetry_master",
  fluorescenceIntensity = "fluorescence_intensity_master",
  fluorescenceColor = "fluorescence_color_master",
  fluorescence = "fluorescence_master",
  lab = "lab_master",
  fancyColor = "fancy_color_master",
  colorIntensity = "color_intensity_master",
  fancyColorIntensity = "fancy_color_intensity_master",
  fancyColorOvertone = "fancy_color_overtone_master",
  GirdleThin = "girdle_thin_master",
  GirdleThick = "girdle_thick_master",
  GirdleCondition = "girdle_condition_master",
  culetCondition = "culet_condition_master",
  LaserInscription = "laser_inscription_master",
  certComment = "cert_comment_master",
  country = "country",
  state = "state",
  city = "city",
  TimeToLocation = "time_to_location_master",
  pairSeparable = "pair_separable_master",
  pairStock = "pair_stock_master",
  parcelStones = "parcel_stones_master",
  tradeShow = "trade_show_master",
  shade = "shade_master",
  centerInclusion = "center_inclusion_master",
  blackInclusion = "black_inclusion_master",
  ReportType = "report_type_master",
  labLocation = "lab_location_master",
  milky = "milky_master",
  BGM = "bgm_master",
  pair = "pair_master",
  HandA = "H&A_master",
  growthType = "growth_type_master",
  Tax = "tax_master",
}


export enum IMAGE_TYPE {
  Banner = "banner_image",
  AboutUsSection = "about_us_image",
  Metal = "metal_master",
  Metal_tone = "metal_tone_master",
  Metal_karat = "metal_karat_master",
  Stone = "stone_master",
  Stone_carat = "stone_carat_master",
  Stone_shape = "stone_shape_master",
  Diamond_color = "diamond_color_master",
  Diamond_clarity = "diamond_clarity_master",
  Diamond_cut = "diamond_cut_master",
  Diamond_certificate = "diamond_certificate_master",
  Diamond_process = "diamond_process_master",
  Item_size = "item_size_master",
  Item_length = "item_length_master",
  Setting_style = "setting_style_master",
  Category_master = "category_master",
  Preference = "select_preference_master",
  Tag = "tag_master",
  Brand = "brand_master",
  User = "user",
  Concierge = "jewelry_concierge",
  Availability = "availability_master",
  CutGrade = "cut_grade_master",
  Polish = "polish_master",
  symmetry = "symmetry_master",
  fluorescenceIntensity = "fluorescence_intensity_master",
  fluorescenceColor = "fluorescence_color_master",
  fluorescence = "fluorescence_master",
  lab = "lab_master",
  fancyColor = "fancy_color_master",
  colorIntensity = "color_intensity_master",
  fancyColorIntensity = "fancy_color_intensity_master",
  fancyColorOvertone = "fancy_color_overtone_master",
  GirdleThin = "girdle_thin_master",
  GirdleThick = "girdle_thick_master",
  GirdleCondition = "girdle_condition_master",
  culetCondition = "culet_condition_master",
  LaserInscription = "laser_inscription_master",
  certComment = "cert_comment_master",
  country = "country",
  state = "state",
  city = "city",
  TimeToLocation = "time_to_location_master",
  pairSeparable = "pair_separable_master",
  pairStock = "pair_stock_master",
  parcelStones = "parcel_stones_master",
  tradeShow = "trade_show_master",
  shade = "shade_master",
  centerInclusion = "center_inclusion_master",
  blackInclusion = "black_inclusion_master",
  ReportType = "report_type_master",
  labLocation = "lab_location_master",
  milky = "milky_master",
  BGM = "bgm_master",
  pair = "pair_master",
  HandA = "H&A_master",
  growthType = "growth_type_master",
  Profile = "user_profile",
}

export enum HTTP_METHODS {
  Get = 1,
  Post = 2,
  Put = 3,
  Delete = 4,
  Patch = 5,
}

export enum FILE_STATUS {
  Uploaded = 1,
  ProcessedSuccess = 2,
  ProcessedError = 3,
}

export enum FILE_BULK_UPLOAD_TYPE {
  ProductUpload = 1,
  ProductZipUpload = 3,
  StockUpload = 2,
  ConfigProductUpload = 4,
}

export enum MEMO_STATUS {
  Active = 'active',
  Close = 'close',
}

export enum FILE_TYPE {
  Customer = 8,
}