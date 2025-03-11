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