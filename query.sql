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

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 