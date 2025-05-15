-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 06-03-2025 new two memo and invoice field -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 

ALTER TABLE IF EXISTS public.invoices
ADD COLUMN cust_order character varying;

ALTER TABLE IF EXISTS public.invoices
ADD COLUMN tracking character varying;

ALTER TABLE IF EXISTS public.memos
ADD COLUMN cust_order character varying;

ALTER TABLE IF EXISTS public.memos
ADD COLUMN tracking character varying;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.memo_list
TABLESPACE pg_default
AS
 SELECT me.id,
    me.company_id,
    me.customer_id,
    me.created_at,
    me.status,
    me.memo_number,
    me.remarks,
    me.contact,
    me.salesperson,
    me.ship_via,
    me.report_date,
    me.cust_order,
    me.tracking,
    cs.company_name AS customer_name,
    cs.country,
    cs.city,
    cs.state,
    cs.postcode,
    cs.address,
    jsonb_build_object('customer_name', cs.company_name, 'customer_email', cs.company_email, 'country', cs.country, 'city', cs.city, 'state', cs.state, 'postcode', cs.postcode, 'address', cs.address, 'contact_person', (au.first_name::text || ' '::text) || au.last_name::text, 'contact_email', au.email, 'contact_phone', au.phone_number) AS customer_details,
    jsonb_build_object('company_name', cp.name, 'company_email', cp.email, 'company_phone', cp.phone_number, 'company_state', cp.state, 'company_city', cp.city, 'company_address', cp.company_address, 'pincode', cp.pincode, 'map_link', cp.map_link, 'contact_person', cp.contact_person, 'registration_number', cp.registration_number, 'bank_details', jsonb_build_object('ac_holder', cp.ac_holder, 'ac_number', cp.ac_number, 'bank_name', cp.bank_name, 'bank_branch', cp.bank_branch, 'bank_branch_code', cp.bank_branch_code)) AS company_details,
    au.first_name,
    au.last_name,
    au.email,
    au.phone_number,
    cp.name AS company_name,
    me.total_item_price,
    me.total_weight,
    me.total_diamond_count,
    aggregated.memo_details
   FROM memos me
     JOIN customers cs ON cs.id = me.customer_id
     JOIN app_users au ON cs.user_id = au.id
     JOIN companys cp ON cp.id = me.company_id
     LEFT JOIN ( SELECT md.memo_id,
            jsonb_agg(DISTINCT jsonb_build_object('stock_price', md.stock_price, 'is_return', md.is_return, 'stock', md.stock_id, 'stock_id', d.stock_id, 'status', d.status, 'quantity', d.quantity, 'weight', d.weight, 'report', d.report, 'video', d.video, 'image', d.image, 'certificate', d.certificate, 'measurement_height', d.measurement_height, 'measurement_width', d.measurement_width, 'measurement_depth', d.measurement_depth, 'table_value', d.table_value, 'depth_value', d.depth_value, 'ratio', d.ratio, 'user_comments', d.user_comments, 'admin_comments', d.admin_comments, 'local_location', d.local_location, 'color_over_tone', d.color_over_tone, 'loose_diamond', d.loose_diamond, 'shape', sm.name, 'shape_id', sm.id, 'clarity', cl.name, 'clarity_id', cl.id, 'color', cm.name, 'color_id', cm.id, 'color_intensity', cim.name, 'color_intensity_id', cim.id, 'lab', lm.name, 'lab_id', lm.id, 'polish', pm.name, 'polish_id', pm.id, 'symmetry', symm.name, 'symmetry_id', symm.id, 'fluorescence', fm.name, 'fluorescence_id', fm.id)) AS memo_details
           FROM memo_details md
             JOIN diamonds d ON d.id = md.stock_id
             LEFT JOIN masters sm ON sm.id = d.shape
             LEFT JOIN masters cm ON cm.id = d.color
             LEFT JOIN masters cl ON cl.id = d.clarity
             LEFT JOIN masters cim ON cim.id = d.color_intensity
             LEFT JOIN masters lm ON lm.id = d.lab
             LEFT JOIN masters pm ON pm.id = d.polish
             LEFT JOIN masters symm ON symm.id = d.symmetry
             LEFT JOIN masters fm ON fm.id = d.fluorescence
          WHERE d.is_deleted = '0'::"bit"
          GROUP BY md.memo_id) aggregated ON aggregated.memo_id = me.id

          CREATE MATERIALIZED VIEW IF NOT EXISTS public.invoice_list
TABLESPACE pg_default
AS
 SELECT ins.id,
    ins.company_id,
    ins.customer_id,
    ins.created_at,
    ins.invoice_number,
    ins.remarks,
    ins.contact,
    ins.salesperson,
    ins.ship_via,
    ins.report_date,
    ins.cust_order,
    ins.tracking,
    ins.total_tax_price,
    ins.total_price,
    ins.total_item_price,
    ins.total_weight,
    ins.total_diamond_count,
    ins.tax_data,
    cs.company_name AS customer_name,
    cs.country,
    cs.city,
    cs.state,
    cs.postcode,
    cs.address,
    jsonb_build_object('customer_name', cs.company_name, 'customer_email', cs.company_email, 'country', cs.country, 'city', cs.city, 'state', cs.state, 'postcode', cs.postcode, 'address', cs.address, 'contact_person', (au.first_name::text || ' '::text) || au.last_name::text, 'contact_email', au.email, 'contact_phone', au.phone_number) AS customer_details,
    jsonb_build_object('company_name', cp.name, 'company_email', cp.email, 'company_phone', cp.phone_number, 'company_state', cp.state, 'company_city', cp.city, 'company_address', cp.company_address, 'pincode', cp.pincode, 'map_link', cp.map_link, 'contact_person', cp.contact_person, 'registration_number', cp.registration_number, 'bank_details', jsonb_build_object('ac_holder', cp.ac_holder, 'ac_number', cp.ac_number, 'bank_name', cp.bank_name, 'bank_branch', cp.bank_branch, 'bank_branch_code', cp.bank_branch_code)) AS company_details,
    au.first_name,
    au.last_name,
    au.email,
    au.phone_number,
    cp.name AS company_name,
    aggregated.invoice_details
   FROM invoices ins
     JOIN customers cs ON cs.id = ins.customer_id
     JOIN app_users au ON cs.user_id = au.id
     JOIN companys cp ON cp.id = ins.company_id
     LEFT JOIN ( SELECT md.invoice_id,
            jsonb_agg(DISTINCT jsonb_build_object('stock_price', md.stock_price, 'stock', d.id, 'stock_id', d.stock_id, 'status', d.status, 'quantity', d.quantity, 'weight', d.weight, 'report', d.report, 'video', d.video, 'image', d.image, 'certificate', d.certificate, 'measurement_height', d.measurement_height, 'measurement_width', d.measurement_width, 'measurement_depth', d.measurement_depth, 'table_value', d.table_value, 'depth_value', d.depth_value, 'ratio', d.ratio, 'user_comments', d.user_comments, 'admin_comments', d.admin_comments, 'local_location', d.local_location, 'color_over_tone', d.color_over_tone, 'loose_diamond', d.loose_diamond, 'shape', sm.name, 'shape_id', sm.id, 'clarity', cl.name, 'clarity_id', cl.id, 'color', cm.name, 'color_id', cm.id, 'color_intensity', cim.name, 'color_intensity_id', cim.id, 'lab', lm.name, 'lab_id', lm.id, 'polish', pm.name, 'polish_id', pm.id, 'symmetry', symm.name, 'symmetry_id', symm.id, 'fluorescence', fm.name, 'fluorescence_id', fm.id)) AS invoice_details
           FROM invoice_details md
             JOIN diamonds d ON d.id = md.stock_id
             LEFT JOIN masters sm ON sm.id = d.shape
             LEFT JOIN masters cm ON cm.id = d.color
             LEFT JOIN masters cl ON cl.id = d.clarity
             LEFT JOIN masters cim ON cim.id = d.color_intensity
             LEFT JOIN masters lm ON lm.id = d.lab
             LEFT JOIN masters pm ON pm.id = d.polish
             LEFT JOIN masters symm ON symm.id = d.symmetry
             LEFT JOIN masters fm ON fm.id = d.fluorescence
          WHERE d.is_deleted = '0'::"bit"
          GROUP BY md.invoice_id) aggregated ON aggregated.invoice_id = ins.id

CREATE TYPE public.invoice_status AS ENUM
    ('close', 'active');

ALTER TYPE public.invoice_status
    OWNER TO postgres;

ALTER TABLE IF EXISTS invoices
    ADD COLUMN status invoice_status DEFAULT 'active'::invoice_status;

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 

ALTER TABLE IF EXISTS public.customers
    ADD COLUMN registration_number character varying;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.invoice_list
TABLESPACE pg_default
AS
SELECT
	INS.ID,
	INS.COMPANY_ID,
	INS.CUSTOMER_ID,
	INS.CREATED_AT,
	INS.INVOICE_NUMBER,
	INS.REMARKS,
	INS.CONTACT,
	INS.SALESPERSON,
	INS.SHIP_VIA,
	INS.REPORT_DATE,
	INS.CUST_ORDER,
	INS.TRACKING,
	INS.TOTAL_TAX_PRICE,
	INS.TOTAL_PRICE,
	INS.TOTAL_ITEM_PRICE,
	INS.TOTAL_WEIGHT,
	INS.TOTAL_DIAMOND_COUNT,
	INS.TAX_DATA,
	CS.COMPANY_NAME AS CUSTOMER_NAME,
	CS.COUNTRY,
	CS.CITY,
	CS.STATE,
	CS.POSTCODE,
	CS.ADDRESS,
	JSONB_BUILD_OBJECT(
		'customer_name',
		CS.COMPANY_NAME,
		'customer_email',
		CS.COMPANY_EMAIL,
		'country',
		CS.COUNTRY,
		'city',
		CS.CITY,
		'state',
		CS.STATE,
		'postcode',
		CS.POSTCODE,
		'address',
		CS.ADDRESS,
		'registration_number',
		CS.registration_number,
		'contact_person',
		(AU.FIRST_NAME::TEXT || ' '::TEXT) || AU.LAST_NAME::TEXT,
		'contact_email',
		AU.EMAIL,
		'contact_phone',
		AU.PHONE_NUMBER
	) AS CUSTOMER_DETAILS,
	JSONB_BUILD_OBJECT(
		'company_name',
		CP.NAME,
		'company_email',
		CP.EMAIL,
		'company_phone',
		CP.PHONE_NUMBER,
		'company_state',
		CP.STATE,
		'company_city',
		CP.CITY,
		'company_address',
		CP.COMPANY_ADDRESS,
		'pincode',
		CP.PINCODE,
		'map_link',
		CP.MAP_LINK,
		'contact_person',
		CP.CONTACT_PERSON,
		'registration_number',
		CP.REGISTRATION_NUMBER,
		'bank_details',
		JSONB_BUILD_OBJECT(
			'ac_holder',
			CP.AC_HOLDER,
			'ac_number',
			CP.AC_NUMBER,
			'bank_name',
			CP.BANK_NAME,
			'bank_branch',
			CP.BANK_BRANCH,
			'bank_branch_code',
			CP.BANK_BRANCH_CODE
		)
	) AS COMPANY_DETAILS,
	AU.FIRST_NAME,
	AU.LAST_NAME,
	AU.EMAIL,
	AU.PHONE_NUMBER,
	CP.NAME AS COMPANY_NAME,
	AGGREGATED.INVOICE_DETAILS
FROM
	INVOICES INS
	JOIN CUSTOMERS CS ON CS.ID = INS.CUSTOMER_ID
	JOIN APP_USERS AU ON CS.USER_ID = AU.ID
	JOIN COMPANYS CP ON CP.ID = INS.COMPANY_ID
	LEFT JOIN (
		SELECT
			MD.INVOICE_ID,
			JSONB_AGG(
				DISTINCT JSONB_BUILD_OBJECT(
					'stock_price',
					MD.STOCK_PRICE,
					'stock',
					D.ID,
					'stock_id',
					D.STOCK_ID,
					'status',
					D.STATUS,
					'quantity',
					D.QUANTITY,
					'weight',
					D.WEIGHT,
					'report',
					D.REPORT,
					'video',
					D.VIDEO,
					'image',
					D.IMAGE,
					'certificate',
					D.CERTIFICATE,
					'measurement_height',
					D.MEASUREMENT_HEIGHT,
					'measurement_width',
					D.MEASUREMENT_WIDTH,
					'measurement_depth',
					D.MEASUREMENT_DEPTH,
					'table_value',
					D.TABLE_VALUE,
					'depth_value',
					D.DEPTH_VALUE,
					'ratio',
					D.RATIO,
					'user_comments',
					D.USER_COMMENTS,
					'admin_comments',
					D.ADMIN_COMMENTS,
					'local_location',
					D.LOCAL_LOCATION,
					'color_over_tone',
					D.COLOR_OVER_TONE,
					'loose_diamond',
					D.LOOSE_DIAMOND,
					'shape',
					SM.NAME,
					'shape_id',
					SM.ID,
					'clarity',
					CL.NAME,
					'clarity_id',
					CL.ID,
					'color',
					CM.NAME,
					'color_id',
					CM.ID,
					'color_intensity',
					CIM.NAME,
					'color_intensity_id',
					CIM.ID,
					'lab',
					LM.NAME,
					'lab_id',
					LM.ID,
					'polish',
					PM.NAME,
					'polish_id',
					PM.ID,
					'symmetry',
					SYMM.NAME,
					'symmetry_id',
					SYMM.ID,
					'fluorescence',
					FM.NAME,
					'fluorescence_id',
					FM.ID
				)
			) AS INVOICE_DETAILS
		FROM
			INVOICE_DETAILS MD
			JOIN DIAMONDS D ON D.ID = MD.STOCK_ID
			LEFT JOIN MASTERS SM ON SM.ID = D.SHAPE
			LEFT JOIN MASTERS CM ON CM.ID = D.COLOR
			LEFT JOIN MASTERS CL ON CL.ID = D.CLARITY
			LEFT JOIN MASTERS CIM ON CIM.ID = D.COLOR_INTENSITY
			LEFT JOIN MASTERS LM ON LM.ID = D.LAB
			LEFT JOIN MASTERS PM ON PM.ID = D.POLISH
			LEFT JOIN MASTERS SYMM ON SYMM.ID = D.SYMMETRY
			LEFT JOIN MASTERS FM ON FM.ID = D.FLUORESCENCE
		WHERE
			D.IS_DELETED = '0'::"bit"
		GROUP BY
			MD.INVOICE_ID
	) AGGREGATED ON AGGREGATED.INVOICE_ID = INS.ID

  -- View: public.memo_list
-- DROP MATERIALIZED VIEW IF EXISTS public.memo_list;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.memo_list
TABLESPACE pg_default
AS
SELECT
	ME.ID,
	ME.COMPANY_ID,
	ME.CUSTOMER_ID,
	ME.CREATED_AT,
	ME.STATUS,
	ME.MEMO_NUMBER,
	ME.REMARKS,
	ME.CONTACT,
	ME.SALESPERSON,
	ME.SHIP_VIA,
	ME.REPORT_DATE,
	ME.CUST_ORDER,
	ME.TRACKING,
	CS.COMPANY_NAME AS CUSTOMER_NAME,
	CS.COUNTRY,
	CS.CITY,
	CS.STATE,
	CS.POSTCODE,
	CS.ADDRESS,
	JSONB_BUILD_OBJECT(
		'customer_name',
		CS.COMPANY_NAME,
		'customer_email',
		CS.COMPANY_EMAIL,
		'country',
		CS.COUNTRY,
		'city',
		CS.CITY,
		'state',
		CS.STATE,
		'postcode',
		CS.POSTCODE,
		'address',
		CS.ADDRESS,
		'registration_number',
		CS.registration_number,
		'contact_person',
		(AU.FIRST_NAME::TEXT || ' '::TEXT) || AU.LAST_NAME::TEXT,
		'contact_email',
		AU.EMAIL,
		'contact_phone',
		AU.PHONE_NUMBER
	) AS CUSTOMER_DETAILS,
	JSONB_BUILD_OBJECT(
		'company_name',
		CP.NAME,
		'company_email',
		CP.EMAIL,
		'company_phone',
		CP.PHONE_NUMBER,
		'company_state',
		CP.STATE,
		'company_city',
		CP.CITY,
		'company_address',
		CP.COMPANY_ADDRESS,
		'pincode',
		CP.PINCODE,
		'map_link',
		CP.MAP_LINK,
		'contact_person',
		CP.CONTACT_PERSON,
		'registration_number',
		CP.REGISTRATION_NUMBER,
		'bank_details',
		JSONB_BUILD_OBJECT(
			'ac_holder',
			CP.AC_HOLDER,
			'ac_number',
			CP.AC_NUMBER,
			'bank_name',
			CP.BANK_NAME,
			'bank_branch',
			CP.BANK_BRANCH,
			'bank_branch_code',
			CP.BANK_BRANCH_CODE
		)
	) AS COMPANY_DETAILS,
	AU.FIRST_NAME,
	AU.LAST_NAME,
	AU.EMAIL,
	AU.PHONE_NUMBER,
	CP.NAME AS COMPANY_NAME,
	ME.TOTAL_ITEM_PRICE,
	ME.TOTAL_WEIGHT,
	ME.TOTAL_DIAMOND_COUNT,
	AGGREGATED.MEMO_DETAILS
FROM
	MEMOS ME
	JOIN CUSTOMERS CS ON CS.ID = ME.CUSTOMER_ID
	JOIN APP_USERS AU ON CS.USER_ID = AU.ID
	JOIN COMPANYS CP ON CP.ID = ME.COMPANY_ID
	LEFT JOIN (
		SELECT
			MD.MEMO_ID,
			JSONB_AGG(
				DISTINCT JSONB_BUILD_OBJECT(
					'stock_price',
					MD.STOCK_PRICE,
					'is_return',
					MD.IS_RETURN,
					'stock',
					MD.STOCK_ID,
					'stock_id',
					D.STOCK_ID,
					'status',
					D.STATUS,
					'quantity',
					D.QUANTITY,
					'weight',
					D.WEIGHT,
					'report',
					D.REPORT,
					'video',
					D.VIDEO,
					'image',
					D.IMAGE,
					'certificate',
					D.CERTIFICATE,
					'measurement_height',
					D.MEASUREMENT_HEIGHT,
					'measurement_width',
					D.MEASUREMENT_WIDTH,
					'measurement_depth',
					D.MEASUREMENT_DEPTH,
					'table_value',
					D.TABLE_VALUE,
					'depth_value',
					D.DEPTH_VALUE,
					'ratio',
					D.RATIO,
					'user_comments',
					D.USER_COMMENTS,
					'admin_comments',
					D.ADMIN_COMMENTS,
					'local_location',
					D.LOCAL_LOCATION,
					'color_over_tone',
					D.COLOR_OVER_TONE,
					'loose_diamond',
					D.LOOSE_DIAMOND,
					'shape',
					SM.NAME,
					'shape_id',
					SM.ID,
					'clarity',
					CL.NAME,
					'clarity_id',
					CL.ID,
					'color',
					CM.NAME,
					'color_id',
					CM.ID,
					'color_intensity',
					CIM.NAME,
					'color_intensity_id',
					CIM.ID,
					'lab',
					LM.NAME,
					'lab_id',
					LM.ID,
					'polish',
					PM.NAME,
					'polish_id',
					PM.ID,
					'symmetry',
					SYMM.NAME,
					'symmetry_id',
					SYMM.ID,
					'fluorescence',
					FM.NAME,
					'fluorescence_id',
					FM.ID
				)
			) AS MEMO_DETAILS
		FROM
			MEMO_DETAILS MD
			JOIN DIAMONDS D ON D.ID = MD.STOCK_ID
			LEFT JOIN MASTERS SM ON SM.ID = D.SHAPE
			LEFT JOIN MASTERS CM ON CM.ID = D.COLOR
			LEFT JOIN MASTERS CL ON CL.ID = D.CLARITY
			LEFT JOIN MASTERS CIM ON CIM.ID = D.COLOR_INTENSITY
			LEFT JOIN MASTERS LM ON LM.ID = D.LAB
			LEFT JOIN MASTERS PM ON PM.ID = D.POLISH
			LEFT JOIN MASTERS SYMM ON SYMM.ID = D.SYMMETRY
			LEFT JOIN MASTERS FM ON FM.ID = D.FLUORESCENCE
		WHERE
			D.IS_DELETED = '0'::"bit"
		GROUP BY
			MD.MEMO_ID
	) AGGREGATED ON AGGREGATED.MEMO_ID = ME.ID

    -- - -  - -- - - - -- - - - - - - - - - - - 

  DROP MATERIALIZED VIEW IF EXISTS public.diamond_list;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.diamond_list
TABLESPACE pg_default
AS
WITH
	FILTERED_MEMO_DETAILS AS (
		SELECT
			MD.STOCK_ID,
			MS.CUSTOMER_ID,
			MS.ID AS MEMO_ID,
			ROW_NUMBER() OVER (
				PARTITION BY
					MD.STOCK_ID
				ORDER BY
					MS.CREATED_AT DESC
			) AS ROW_NUM
		FROM
			MEMO_DETAILS MD
			JOIN MEMOS MS ON MS.ID = MD.MEMO_ID
		WHERE
			MS.STATUS = 'active'::MEMO_STATUS
			AND MD.IS_RETURN = '0'::BIT(1)
	),
	FILTERED_INVOICE_DETAILS AS (
		SELECT
			IDS.STOCK_ID,
			IO.CUSTOMER_ID,
			IO.ID AS INVOICE_ID,
			ROW_NUMBER() OVER (
				PARTITION BY
					IDS.STOCK_ID
				ORDER BY
					IO.CREATED_AT DESC
			) AS ROW_NUM
		FROM
			INVOICE_DETAILS IDS
			JOIN INVOICES IO ON IO.ID = IDS.INVOICE_ID
		WHERE
			IO.STATUS = 'active'::INVOICE_STATUS
			AND IDS.IS_RETURN = '0'::BIT(1)
	)
SELECT
	D.ID,
	D.STOCK_ID,
	D.SHAPE,
	SM.NAME AS SHAPE_NAME,
	D.CLARITY,
	CL.NAME AS CLARITY_NAME,
	D.COLOR,
	CM.NAME AS COLOR_NAME,
	D.COLOR_INTENSITY,
	CIM.NAME AS COLOR_INTENSITY_NAME,
	D.LAB,
	LM.NAME AS LAB_NAME,
	D.POLISH,
	PM.NAME AS POLISH_NAME,
	D.SYMMETRY,
	SYMM.NAME AS SYMMETRY_NAME,
	D.FLUORESCENCE,
	FM.NAME AS FLUORESCENCE_NAME,
	D.QUANTITY,
	D.WEIGHT,
	D.REPORT,
	D.VIDEO,
	D.IMAGE,
	D.CERTIFICATE,
	D.MEASUREMENT_HEIGHT,
	D.MEASUREMENT_WIDTH,
	D.MEASUREMENT_DEPTH,
	D.TABLE_VALUE,
	D.DEPTH_VALUE,
	D.RATIO,
	D.USER_COMMENTS,
	D.ADMIN_COMMENTS,
	D.LOCAL_LOCATION,
	D.STATUS,
	D.RATE,
	D.COMPANY_ID,
	COM.NAME AS COMPANY_NAME,
	D.LOOSE_DIAMOND,
	D.COLOR_OVER_TONE,
	D.IS_ACTIVE,
	D.CREATED_AT,
	D.CREATED_BY,
	CASE
		WHEN D.STATUS = 'sold'::STOCK_STATUS
		AND FID.ROW_NUM = 1 THEN FID.INVOICE_ID
		ELSE NULL::BIGINT
	END AS INVOICE_ID,
	CASE
		WHEN D.STATUS = 'memo'::STOCK_STATUS
		AND FMD.ROW_NUM = 1 THEN FMD.MEMO_ID
		ELSE NULL::BIGINT
	END AS MEMO_ID,
	CASE
		WHEN D.STATUS = 'memo'::STOCK_STATUS
		AND FMD.ROW_NUM = 1 THEN FMD.CUSTOMER_ID
		WHEN D.STATUS = 'sold'::STOCK_STATUS
		AND FID.ROW_NUM = 1 THEN FID.CUSTOMER_ID
		ELSE NULL::BIGINT
	END AS CUSTOMER_ID,
	CASE
		WHEN D.STATUS = 'memo'::STOCK_STATUS
		AND FMD.ROW_NUM = 1 THEN AU.ID
		WHEN D.STATUS = 'sold'::STOCK_STATUS
		AND FID.ROW_NUM = 1 THEN AUI.ID
		ELSE NULL::BIGINT
	END AS USER_ID,
	CASE
		WHEN D.STATUS = 'memo'::STOCK_STATUS
		AND FMD.ROW_NUM = 1 THEN AU.FIRST_NAME
		WHEN D.STATUS = 'sold'::STOCK_STATUS
		AND FID.ROW_NUM = 1 THEN AUI.FIRST_NAME
		ELSE NULL::CHARACTER VARYING
	END AS FIRST_NAME,
	CASE
		WHEN D.STATUS = 'memo'::STOCK_STATUS
		AND FMD.ROW_NUM = 1 THEN AU.LAST_NAME
		WHEN D.STATUS = 'sold'::STOCK_STATUS
		AND FID.ROW_NUM = 1 THEN AUI.LAST_NAME
		ELSE NULL::CHARACTER VARYING
	END AS LAST_NAME,
	CASE
		WHEN D.STATUS = 'memo'::STOCK_STATUS
		AND FMD.ROW_NUM = 1 THEN CS.COMPANY_NAME
		WHEN D.STATUS = 'sold'::STOCK_STATUS
		AND FID.ROW_NUM = 1 THEN CSI.COMPANY_NAME
		ELSE NULL::CHARACTER VARYING
	END AS CUSTOMER_NAME
FROM
	DIAMONDS D
	LEFT JOIN MASTERS SM ON SM.ID = D.SHAPE
	LEFT JOIN MASTERS CM ON CM.ID = D.COLOR
	LEFT JOIN MASTERS CL ON CL.ID = D.CLARITY
	LEFT JOIN MASTERS CIM ON CIM.ID = D.COLOR_INTENSITY
	LEFT JOIN MASTERS LM ON LM.ID = D.LAB
	LEFT JOIN MASTERS PM ON PM.ID = D.POLISH
	LEFT JOIN MASTERS SYMM ON SYMM.ID = D.SYMMETRY
	LEFT JOIN COMPANYS COM ON COM.ID = D.COMPANY_ID
	LEFT JOIN MASTERS FM ON FM.ID = D.FLUORESCENCE
	LEFT JOIN FILTERED_MEMO_DETAILS FMD ON FMD.STOCK_ID = D.ID
	LEFT JOIN FILTERED_INVOICE_DETAILS FID ON FID.STOCK_ID = D.ID
	LEFT JOIN CUSTOMERS CS ON CS.ID = FMD.CUSTOMER_ID
	LEFT JOIN APP_USERS AU ON AU.ID = CS.USER_ID
	LEFT JOIN CUSTOMERS CSI ON CSI.ID = FID.CUSTOMER_ID
	LEFT JOIN APP_USERS AUI ON AUI.ID = CSI.USER_ID
WHERE
	D.IS_DELETED = '0'::BIT(1)
ORDER BY
	D.ID DESC

CREATE TYPE discount_type AS ENUM ('percentage','amount')

ALTER TABLE IF EXISTS invoices
    ADD COLUMN discount_type discount_type DEFAULT 'amount'::discount_type;
	
ALTER TABLE IF EXISTS public.invoices
    ADD COLUMN discount double precision;

ALTER TABLE IF EXISTS public.invoices
    ADD COLUMN shipping_charge double precision;
	
ALTER TABLE IF EXISTS memos
    ADD COLUMN discount_type discount_type DEFAULT 'amount'::discount_type;

ALTER TABLE IF EXISTS public.memos
    ADD COLUMN discount double precision;

ALTER TABLE IF EXISTS public.memos
    ADD COLUMN shipping_charge double precision;

ALTER TABLE IF EXISTS public.memos
    ADD COLUMN total_price double precision;

	-- Table: public.currency_jsons

-- DROP TABLE IF EXISTS public.currency_jsons;

CREATE TABLE IF NOT EXISTS public.currency_jsons
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    json json NOT NULL,
    date timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT currency_json_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.currency_jsons
    OWNER to postgres;

---------------------------------------- 08-05-2025 new table for packet diamonds ----------------------------------------

CREATE TABLE IF NOT EXISTS public.packet_diamonds
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    packet_id character varying COLLATE pg_catalog."default" NOT NULL,
    shape bigint NOT NULL,
    quantity bigint NOT NULL,
    weight double precision NOT NULL,
	carat_rate double precision NOT NULL,
    rate double precision NOT NULL,
    color bigint,
    color_intensity bigint,
    clarity bigint,
    video character varying COLLATE pg_catalog."default",
    image character varying COLLATE pg_catalog."default",
    certificate character varying COLLATE pg_catalog."default",
    lab bigint,
    report bigint,
    polish bigint,
    symmetry bigint,
    table_value double precision,
    depth_value double precision,
    ratio character varying COLLATE pg_catalog."default",
    company_id bigint,
    user_comments character varying COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL,
    created_by bigint NOT NULL,
    is_active bit(1) NOT NULL DEFAULT (0)::bit(1),
    is_deleted bit(1) NOT NULL DEFAULT (0)::bit(1),
    modified_at timestamp with time zone,
    modified_by bigint,
    deleted_at timestamp with time zone,
    deleted_by bigint,
    fluorescence bigint,
    admin_comments character varying COLLATE pg_catalog."default",
    measurement_height double precision,
    measurement_width double precision,
    measurement_depth double precision,
    status stock_status DEFAULT 'available'::stock_status,
    loose_diamond loose_diamond NOT NULL DEFAULT 'No'::loose_diamond,
    color_over_tone character varying COLLATE pg_catalog."default",
    CONSTRAINT packet_diamonds_pkey PRIMARY KEY (id),
    CONSTRAINT fk_clarity FOREIGN KEY (clarity)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_color FOREIGN KEY (color)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_color_intensity FOREIGN KEY (color_intensity)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_company FOREIGN KEY (company_id)
        REFERENCES public.companys (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_fluorescence FOREIGN KEY (fluorescence)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT fk_lab FOREIGN KEY (lab)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_polish FOREIGN KEY (polish)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_shape FOREIGN KEY (shape)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_symmetry FOREIGN KEY (symmetry)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;


CREATE TYPE memo_invoice_type AS ENUM(
	'carat',
	'quantity'
);

ALTER TABLE IF EXISTS memo_details
    ADD COLUMN memo_type memo_invoice_type DEFAULT 'quantity'::memo_invoice_type;


ALTER TABLE IF EXISTS invoice_details
    ADD COLUMN invoice_type memo_invoice_type DEFAULT 'quantity'::memo_invoice_type;


ALTER TABLE IF EXISTS public.invoice_details
    ADD COLUMN quantity bigint;


ALTER TABLE IF EXISTS public.memo_details
    ADD COLUMN quantity bigint;

CREATE TYPE public.memo_invoice_creation_type AS ENUM
    ('single', 'packet');

ALTER TABLE IF EXISTS memos
    ADD COLUMN creation_type memo_invoice_creation_type DEFAULT 'single'::memo_invoice_creation_type;

ALTER TABLE IF EXISTS invoices
    ADD COLUMN creation_type memo_invoice_creation_type DEFAULT 'single'::memo_invoice_creation_type;

ALTER TABLE IF EXISTS public.memo_details DROP CONSTRAINT IF EXISTS fk_stock;

ALTER TABLE IF EXISTS public.invoice_details DROP CONSTRAINT IF EXISTS fk_stock;

ALTER TABLE IF EXISTS public.memo_details
    ADD COLUMN weight double precision;

ALTER TABLE IF EXISTS public.invoice_details
    ADD COLUMN weight double precision;

/* 12-05-2025 */

ALTER TABLE IF EXISTS public.diamonds
    ADD COLUMN remain_quantity bigint;

-- Table: public.packet_diamonds

CREATE TABLE IF NOT EXISTS public.packet_diamonds
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    packet_id character varying COLLATE pg_catalog."default" NOT NULL,
    shape bigint NOT NULL,
    quantity bigint NOT NULL,
    weight double precision NOT NULL,
    rate double precision NOT NULL,
    color bigint,
    color_intensity bigint,
    clarity bigint,
    video character varying COLLATE pg_catalog."default",
    image character varying COLLATE pg_catalog."default",
    certificate character varying COLLATE pg_catalog."default",
    lab bigint,
    report bigint,
    polish bigint,
    symmetry bigint,
    table_value double precision,
    depth_value double precision,
    ratio character varying COLLATE pg_catalog."default",
    company_id bigint,
    user_comments character varying COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL,
    created_by bigint NOT NULL,
    is_active bit(1) NOT NULL DEFAULT (0)::bit(1),
    is_deleted bit(1) NOT NULL DEFAULT (0)::bit(1),
    modified_at timestamp with time zone,
    modified_by bigint,
    deleted_at timestamp with time zone,
    deleted_by bigint,
    fluorescence bigint,
    admin_comments character varying COLLATE pg_catalog."default",
    measurement_height double precision,
    measurement_width double precision,
    measurement_depth double precision,
    local_location character varying COLLATE pg_catalog."default",
    status stock_status DEFAULT 'available'::stock_status,
    color_over_tone character varying COLLATE pg_catalog."default",
    carat_rate double precision NOT NULL,
    remain_weight double precision,
    remain_quantity bigint,
    CONSTRAINT packet_diamonds_pkey PRIMARY KEY (id),
    CONSTRAINT fk_clarity FOREIGN KEY (clarity)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_color FOREIGN KEY (color)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_color_intensity FOREIGN KEY (color_intensity)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_company FOREIGN KEY (company_id)
        REFERENCES public.companys (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_fluorescence FOREIGN KEY (fluorescence)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_lab FOREIGN KEY (lab)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_polish FOREIGN KEY (polish)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_shape FOREIGN KEY (shape)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_symmetry FOREIGN KEY (symmetry)
        REFERENCES public.masters (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.packet_diamonds
    OWNER to postgres;

-- update diamond list materialized view

DROP MATERIALIZED VIEW IF EXISTS public.diamond_list;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.diamond_list
TABLESPACE pg_default
AS
 WITH filtered_memo_details AS (
         SELECT md.stock_id,
            ms.customer_id,
            ms.id AS memo_id,
            row_number() OVER (PARTITION BY md.stock_id ORDER BY ms.created_at DESC) AS row_num
           FROM memo_details md
             JOIN memos ms ON ms.id = md.memo_id
          WHERE ms.status = 'active'::memo_status AND md.is_return = '0'::bit(1)
        ), filtered_invoice_details AS (
         SELECT ids.stock_id,
            io.customer_id,
            io.id AS invoice_id,
            row_number() OVER (PARTITION BY ids.stock_id ORDER BY io.created_at DESC) AS row_num
           FROM invoice_details ids
             JOIN invoices io ON io.id = ids.invoice_id
          WHERE io.status = 'active'::invoice_status AND ids.is_return = '0'::bit(1)
        )
 SELECT d.id,
    d.stock_id,
    d.shape,
    sm.name AS shape_name,
    d.clarity,
    cl.name AS clarity_name,
    d.color,
    cm.name AS color_name,
    d.color_intensity,
    cim.name AS color_intensity_name,
    d.lab,
    lm.name AS lab_name,
    d.polish,
    pm.name AS polish_name,
    d.symmetry,
    symm.name AS symmetry_name,
    d.fluorescence,
    fm.name AS fluorescence_name,
    d.quantity,
	d.remain_quantity,
    d.weight,
    d.report,
    d.video,
    d.image,
    d.certificate,
    d.measurement_height,
    d.measurement_width,
    d.measurement_depth,
    d.table_value,
    d.depth_value,
    d.ratio,
    d.user_comments,
    d.admin_comments,
    d.local_location,
    d.status,
    d.rate,
    d.company_id,
    com.name AS company_name,
    d.loose_diamond,
    d.color_over_tone,
    d.is_active,
    d.created_at,
    d.created_by,
        CASE
            WHEN d.status = 'sold'::stock_status AND fid.row_num = 1 THEN fid.invoice_id
            ELSE NULL::bigint
        END AS invoice_id,
        CASE
            WHEN d.status = 'memo'::stock_status AND fmd.row_num = 1 THEN fmd.memo_id
            ELSE NULL::bigint
        END AS memo_id,
        CASE
            WHEN d.status = 'memo'::stock_status AND fmd.row_num = 1 THEN fmd.customer_id
            WHEN d.status = 'sold'::stock_status AND fid.row_num = 1 THEN fid.customer_id
            ELSE NULL::bigint
        END AS customer_id,
        CASE
            WHEN d.status = 'memo'::stock_status AND fmd.row_num = 1 THEN au.id
            WHEN d.status = 'sold'::stock_status AND fid.row_num = 1 THEN aui.id
            ELSE NULL::bigint
        END AS user_id,
        CASE
            WHEN d.status = 'memo'::stock_status AND fmd.row_num = 1 THEN au.first_name
            WHEN d.status = 'sold'::stock_status AND fid.row_num = 1 THEN aui.first_name
            ELSE NULL::character varying
        END AS first_name,
        CASE
            WHEN d.status = 'memo'::stock_status AND fmd.row_num = 1 THEN au.last_name
            WHEN d.status = 'sold'::stock_status AND fid.row_num = 1 THEN aui.last_name
            ELSE NULL::character varying
        END AS last_name,
        CASE
            WHEN d.status = 'memo'::stock_status AND fmd.row_num = 1 THEN cs.company_name
            WHEN d.status = 'sold'::stock_status AND fid.row_num = 1 THEN csi.company_name
            ELSE NULL::character varying
        END AS customer_name
   FROM diamonds d
     LEFT JOIN masters sm ON sm.id = d.shape
     LEFT JOIN masters cm ON cm.id = d.color
     LEFT JOIN masters cl ON cl.id = d.clarity
     LEFT JOIN masters cim ON cim.id = d.color_intensity
     LEFT JOIN masters lm ON lm.id = d.lab
     LEFT JOIN masters pm ON pm.id = d.polish
     LEFT JOIN masters symm ON symm.id = d.symmetry
     LEFT JOIN companys com ON com.id = d.company_id
     LEFT JOIN masters fm ON fm.id = d.fluorescence
     LEFT JOIN filtered_memo_details fmd ON fmd.stock_id = d.id
     LEFT JOIN filtered_invoice_details fid ON fid.stock_id = d.id
     LEFT JOIN customers cs ON cs.id = fmd.customer_id
     LEFT JOIN app_users au ON au.id = cs.user_id
     LEFT JOIN customers csi ON csi.id = fid.customer_id
     LEFT JOIN app_users aui ON aui.id = csi.user_id
  WHERE d.is_deleted = '0'::bit(1)
  ORDER BY d.id DESC
WITH DATA;

ALTER TABLE IF EXISTS public.diamond_list
    OWNER TO postgres;


-- View: public.packet_diamond_list


CREATE MATERIALIZED VIEW IF NOT EXISTS public.packet_diamond_list
TABLESPACE pg_default
AS
WITH filtered_memo_details AS (
         SELECT md.stock_id,
            ms.customer_id,
            ms.id AS memo_id,
            row_number() OVER (PARTITION BY md.stock_id ORDER BY ms.created_at DESC) AS row_num
           FROM memo_details md
             JOIN memos ms ON ms.id = md.memo_id
          WHERE ms.status = 'active'::memo_status AND md.is_return = '0'::bit(1) AND creation_type = 'packet'
        ), filtered_invoice_details AS (
         SELECT ids.stock_id,
            io.customer_id,
            io.id AS invoice_id,
            row_number() OVER (PARTITION BY ids.stock_id ORDER BY io.created_at DESC) AS row_num
           FROM invoice_details ids
             JOIN invoices io ON io.id = ids.invoice_id
          WHERE io.status = 'active'::invoice_status AND ids.is_return = '0'::bit(1) AND creation_type = 'packet'
        ),
	memo_details AS (
			SELECT 
		stock_id,
		COALESCE(COUNT(memo_details.id),0) as memo_count,
		SUM(memo_details.quantity) as memo_quantity,
		SUM(memo_details.weight) as memo_weight,
		SUM(memo_details.stock_price) as memo_stock_price,
		CASE WHEN memo_details.memo_type = 'quantity' THEN
			CEIL(SUM(memo_details.quantity) * 100 / packet_diamonds.quantity) 
			ELSE CEIL(SUM(memo_details.weight) * 100 / packet_diamonds.weight) 
			END as memo_status_per,
		
		memo_details.memo_type FROM memos 
		INNER JOIN memo_details ON memo_details.memo_id = memos.id
		LEFT JOIN packet_diamonds ON packet_diamonds.id = stock_id
		WHERE creation_type = 'packet' AND memos.status = 'active'::memo_status AND memo_details.is_return = '0'::bit(1)
		GROUP BY memo_details.memo_type,stock_id,packet_diamonds.id
	),
	invoice_details AS (
			SELECT 
		stock_id,
		SUM(invoice_details.quantity) as invoice_quantity,
		SUM(invoice_details.weight) as invoice_weight,
		COALESCE(COUNT(invoice_details.id),0) as invoice_count,
		SUM(invoice_details.quantity),
		SUM(invoice_details.stock_price) as sold_out_stock_price,
		CASE WHEN invoice_details.invoice_type = 'quantity' THEN 
			CEIL(SUM(invoice_details.quantity) * 100 / packet_diamonds.quantity) 
			ELSE CEIL(SUM(invoice_details.weight) * 100 / packet_diamonds.weight) 
			END as sold_status_per,
		invoice_details.invoice_type FROM invoices 
		INNER JOIN invoice_details ON invoice_details.invoice_id = invoices.id
		LEFT JOIN packet_diamonds ON packet_diamonds.id = invoice_details.stock_id
		WHERE creation_type = 'packet' AND invoices.status = 'active' AND invoice_details.is_return = '0'
		GROUP BY invoice_details.invoice_type,stock_id,packet_diamonds.id
	)

 SELECT d.id,
    d.packet_id,
	d.shape,
    sm.name AS shape_name,
    d.clarity,
    cl.name AS clarity_name,
    d.color,
    cm.name AS color_name,
    d.color_intensity,
    cim.name AS color_intensity_name,
    d.lab,
    lm.name AS lab_name,
    d.polish,
    pm.name AS polish_name,
    d.symmetry,
    symm.name AS symmetry_name,
    d.fluorescence,
    fm.name AS fluorescence_name,
    d.quantity,
    d.remain_quantity,
    d.remain_weight,
    d.weight,
    d.report,
    d.video,
    d.image,
    d.certificate,
    d.measurement_height,
    d.measurement_width,
    d.measurement_depth,
    d.table_value,
    d.depth_value,
    d.ratio,
    d.user_comments,
    d.admin_comments,
    d.local_location,
    d.status,
    d.rate,
    d.color_over_tone,
    d.is_active,
    d.created_at,
    d.created_by,
	memo_type,
	invoice_type,
    jsonb_agg(DISTINCT jsonb_build_object('id', fmd.memo_id, 'company_id', cs.id, 'company_name', cs.company_name, 'company_website', cs.company_website, 'company_email', cs.company_email)) AS company_detail,
   COALESCE(memo_details.memo_status_per,0) as memo_status_per,
   COALESCE(invoice_details.sold_status_per,0) as sold_out_status_per,
   CASE WHEN (memo_details.memo_type = 'quantity' OR invoice_details.invoice_type = 'quantity') OR (memo_count = 0 AND invoice_count = 0) THEN  
		CEIL(d.remain_quantity * 100 / d.quantity) 
		ELSE CEIL(d.remain_weight * 100 / d.weight) 
		END as available_status_per,
	COALESCE(memo_quantity,0) as total_memo_quantity,
	COALESCE(invoice_quantity,0) as total_sold_out_quantity,
	COALESCE(d.remain_quantity,0) as total_available_quantity,
	COALESCE(memo_weight,0) as total_memo_weight,
	COALESCE(invoice_weight,0) as total_sold_out_weight,
	COALESCE(d.remain_weight,0) total_available_weight,
	COALESCE(memo_stock_price, 0) as total_memo_stock_price,
	COALESCE(sold_out_stock_price, 0) as total_sold_out_stock_price,
	CASE WHEN COALESCE(memo_count,0) = 0 AND COALESCE(invoice_count,0) = 0 THEN d.rate ELSE CASE WHEN memo_details.memo_type = 'quantity' OR invoice_details.invoice_type = 'quantity' THEN  
		CEIL(d.rate * d.remain_quantity / 100) 
		ELSE CEIL(d.rate * d.remain_weight / 100) 
		END END as total_available_stock_price
   FROM packet_diamonds d
     LEFT JOIN masters sm ON sm.id = d.shape
     LEFT JOIN masters cm ON cm.id = d.color
     LEFT JOIN masters cl ON cl.id = d.clarity
     LEFT JOIN masters cim ON cim.id = d.color_intensity
     LEFT JOIN masters lm ON lm.id = d.lab
     LEFT JOIN masters pm ON pm.id = d.polish
     LEFT JOIN masters symm ON symm.id = d.symmetry
     LEFT JOIN companys com ON com.id = d.company_id
     LEFT JOIN masters fm ON fm.id = d.fluorescence
     LEFT JOIN filtered_memo_details fmd ON fmd.stock_id = d.id
	 LEFT JOIN memo_details ON memo_details.stock_id = d.id
	 LEFT JOIN invoice_details ON invoice_details.stock_id = d.id
     LEFT JOIN filtered_invoice_details fid ON fid.stock_id = d.id
     LEFT JOIN customers cs ON cs.id = fmd.customer_id
     LEFT JOIN app_users au ON au.id = cs.user_id
     LEFT JOIN customers csi ON csi.id = fid.customer_id
     LEFT JOIN app_users aui ON aui.id = csi.user_id
  WHERE d.is_deleted = '0'::bit(1)
  GROUP BY d.id, sm.name, cl.name, cm.name, cim.name, lm.name, pm.name, symm.name, fm.name,
  memo_details.memo_status_per,memo_details.memo_type,invoice_details.sold_status_per,
  memo_stock_price,sold_out_stock_price,invoice_details.invoice_type,memo_count,invoice_count,
  memo_quantity,invoice_quantity,memo_weight,invoice_weight
  ORDER BY d.id DESC
  WITH DATA;

ALTER TABLE IF EXISTS public.packet_diamond_list
    OWNER TO postgres;


/* update packet diamond list materialized view */

DROP MATERIALIZED VIEW IF EXISTS public.packet_diamond_list;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.packet_diamond_list
TABLESPACE pg_default
AS
 WITH filtered_memo_details AS (
         SELECT md.stock_id,
            ms.customer_id,
            ms.id AS memo_id,
            row_number() OVER (PARTITION BY md.stock_id ORDER BY ms.created_at DESC) AS row_num
           FROM public.memo_details md
             JOIN memos ms ON ms.id = md.memo_id
          WHERE ms.status = 'active'::memo_status AND md.is_return = '0'::bit(1) AND ms.creation_type = 'packet'::memo_invoice_creation_type
        ), filtered_invoice_details AS (
         SELECT ids.stock_id,
            io.customer_id,
            io.id AS invoice_id,
            row_number() OVER (PARTITION BY ids.stock_id ORDER BY io.created_at DESC) AS row_num
           FROM public.invoice_details ids
             JOIN invoices io ON io.id = ids.invoice_id
          WHERE io.status = 'active'::invoice_status AND ids.is_return = '0'::bit(1) AND io.creation_type = 'packet'::memo_invoice_creation_type
        ), memo_details AS (
         SELECT memo_details_1.stock_id,
            COALESCE(count(memo_details_1.id), 0::bigint) AS memo_count,
            sum(memo_details_1.quantity) AS memo_quantity,
            sum(memo_details_1.weight) AS memo_weight,
            sum(memo_details_1.stock_price) AS memo_stock_price,
                CASE
                    WHEN memo_details_1.memo_type = 'quantity'::memo_invoice_type THEN ceil(sum(memo_details_1.quantity) * 100::numeric / packet_diamonds.quantity::numeric)::double precision
                    ELSE ceil(sum(memo_details_1.weight) * 100::double precision / packet_diamonds.weight)
                END AS memo_status_per,
            memo_details_1.memo_type
           FROM memos
             JOIN public.memo_details memo_details_1 ON memo_details_1.memo_id = memos.id
             LEFT JOIN packet_diamonds ON packet_diamonds.id = memo_details_1.stock_id
          WHERE memos.creation_type = 'packet'::memo_invoice_creation_type AND memos.status = 'active'::memo_status AND memo_details_1.is_return = '0'::bit(1)
          GROUP BY memo_details_1.memo_type, memo_details_1.stock_id, packet_diamonds.id
        ), invoice_details AS (
         SELECT invoice_details_1.stock_id,
            sum(invoice_details_1.quantity) AS invoice_quantity,
            sum(invoice_details_1.weight) AS invoice_weight,
            COALESCE(count(invoice_details_1.id), 0::bigint) AS invoice_count,
            sum(invoice_details_1.quantity) AS sum,
            sum(invoice_details_1.stock_price) AS sold_out_stock_price,
                CASE
                    WHEN invoice_details_1.invoice_type = 'quantity'::memo_invoice_type THEN ceil(sum(invoice_details_1.quantity) * 100::numeric / packet_diamonds.quantity::numeric)::double precision
                    ELSE ceil(sum(invoice_details_1.weight) * 100::double precision / packet_diamonds.weight)
                END AS sold_status_per,
            invoice_details_1.invoice_type
           FROM invoices
             JOIN public.invoice_details invoice_details_1 ON invoice_details_1.invoice_id = invoices.id
             LEFT JOIN packet_diamonds ON packet_diamonds.id = invoice_details_1.stock_id
          WHERE invoices.creation_type = 'packet'::memo_invoice_creation_type AND invoices.status = 'active'::invoice_status AND invoice_details_1.is_return = '0'::"bit"
          GROUP BY invoice_details_1.invoice_type, invoice_details_1.stock_id, packet_diamonds.id
        )
 SELECT d.id,
    d.packet_id,
    d.shape,
    sm.name AS shape_name,
    d.clarity,
    cl.name AS clarity_name,
    d.color,
    cm.name AS color_name,
    d.color_intensity,
    cim.name AS color_intensity_name,
    d.lab,
    lm.name AS lab_name,
    d.polish,
    pm.name AS polish_name,
    d.symmetry,
    symm.name AS symmetry_name,
    d.fluorescence,
    fm.name AS fluorescence_name,
    d.carat_rate AS price_per_carat,
    d.quantity,
    d.remain_quantity,
    d.remain_weight,
    d.weight,
    d.report,
    d.video,
    d.image,
    d.certificate,
    d.measurement_height,
    d.measurement_width,
    d.measurement_depth,
    d.table_value,
    d.depth_value,
    d.ratio,
    d.user_comments,
    d.admin_comments,
    d.local_location,
    d.status,
    d.rate,
    d.color_over_tone,
    d.is_active,
    d.created_at,
    d.created_by,
    d.company_id,
    com.name AS company_name,
    memo_details.memo_type,
    invoice_details.invoice_type,
    COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', fmd.memo_id, 'company_id', cs.id, 'company_name', cs.company_name, 'company_website', cs.company_website, 'company_email', cs.company_email)) FILTER (WHERE fmd.memo_id IS NOT NULL), '[]'::jsonb) AS memo_company_detail,
    COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', fid.invoice_id, 'company_id', ics.id, 'company_name', ics.company_name, 'company_website', ics.company_website, 'company_email', ics.company_email)) FILTER (WHERE fid.invoice_id IS NOT NULL), '[]'::jsonb) AS invoice_company_detail,
    COALESCE(memo_details.memo_status_per, 0::double precision) AS memo_status_per,
    COALESCE(invoice_details.sold_status_per, 0::double precision) AS sold_out_status_per,
        CASE
            WHEN COALESCE(memo_details.memo_count, 0::bigint) = 0 AND COALESCE(invoice_details.invoice_count, 0::bigint) = 0 THEN 100::double precision
            ELSE
            CASE
                WHEN memo_details.memo_type = 'quantity'::memo_invoice_type OR invoice_details.invoice_type = 'quantity'::memo_invoice_type THEN ceil((d.remain_quantity * 100 / d.quantity)::double precision)
                ELSE ceil(d.remain_weight * 100::double precision / d.weight)
            END
        END AS available_status_per,
    COALESCE(memo_details.memo_quantity, 0::numeric) AS total_memo_quantity,
    COALESCE(invoice_details.invoice_quantity, 0::numeric) AS total_sold_out_quantity,
    COALESCE(d.remain_quantity, 0::bigint) AS total_available_quantity,
    COALESCE(memo_details.memo_weight, 0::double precision) AS total_memo_weight,
    COALESCE(invoice_details.invoice_weight, 0::double precision) AS total_sold_out_weight,
    COALESCE(d.remain_weight, 0::double precision) AS total_available_weight,
    COALESCE(memo_details.memo_stock_price, 0::numeric) AS total_memo_stock_price,
    COALESCE(invoice_details.sold_out_stock_price, 0::double precision) AS total_sold_out_stock_price,
        CASE
            WHEN COALESCE(memo_details.memo_count, 0::bigint) = 0 AND COALESCE(invoice_details.invoice_count, 0::bigint) = 0 THEN d.rate
            ELSE
            CASE
                WHEN memo_details.memo_type = 'quantity'::memo_invoice_type OR invoice_details.invoice_type = 'quantity'::memo_invoice_type THEN ceil(d.rate * d.remain_quantity::double precision / 100::double precision)
                ELSE ceil(d.rate * d.remain_weight / 100::double precision)
            END
        END AS total_available_stock_price
   FROM packet_diamonds d
     LEFT JOIN masters sm ON sm.id = d.shape
     LEFT JOIN masters cm ON cm.id = d.color
     LEFT JOIN masters cl ON cl.id = d.clarity
     LEFT JOIN masters cim ON cim.id = d.color_intensity
     LEFT JOIN masters lm ON lm.id = d.lab
     LEFT JOIN masters pm ON pm.id = d.polish
     LEFT JOIN masters symm ON symm.id = d.symmetry
     LEFT JOIN companys com ON com.id = d.company_id
     LEFT JOIN masters fm ON fm.id = d.fluorescence
     LEFT JOIN filtered_memo_details fmd ON fmd.stock_id = d.id
     LEFT JOIN memo_details ON memo_details.stock_id = d.id
     LEFT JOIN invoice_details ON invoice_details.stock_id = d.id
     LEFT JOIN filtered_invoice_details fid ON fid.stock_id = d.id
     LEFT JOIN customers cs ON cs.id = fmd.customer_id
     LEFT JOIN customers ics ON ics.id = fid.customer_id
     LEFT JOIN app_users au ON au.id = cs.user_id
     LEFT JOIN customers csi ON csi.id = fid.customer_id
     LEFT JOIN app_users aui ON aui.id = csi.user_id
  WHERE d.is_deleted = '0'::bit(1)
  GROUP BY d.id, sm.name, cl.name, cm.name, cim.name, lm.name, pm.name, symm.name, fm.name, memo_details.memo_status_per, memo_details.memo_type, invoice_details.sold_status_per, memo_details.memo_stock_price, invoice_details.sold_out_stock_price, invoice_details.invoice_type, memo_details.memo_count, invoice_details.invoice_count, memo_details.memo_quantity, invoice_details.invoice_quantity, memo_details.memo_weight, invoice_details.invoice_weight, com.name
  ORDER BY d.id DESC
WITH DATA;

ALTER TABLE IF EXISTS public.packet_diamond_list
    OWNER TO postgres;