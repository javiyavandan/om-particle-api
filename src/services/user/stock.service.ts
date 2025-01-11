import { Request } from "express";
import { QueryTypes } from "sequelize";
import dbContext from "../../config/dbContext";
import { getCurrencyPrice, getInitialPaginationFromQuery, resSuccess } from "../../utils/shared-functions";
import { UserType } from "../../utils/app-enumeration";

export const getStockList = async (req: Request) => {
    try {
        const { query } = req;
        const { id } = req.body.session_res;
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text ?? "0",
        };
        let noPagination = req.query.no_pagination === "1";

        const currency = await getCurrencyPrice(query.currency as string);
        const shapes = query.shape ? (query.shape as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const colors = query.color ? (query.color as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const color_intensity = query.color_intensity ? (query.color_intensity as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const clarity = query.clarity ? (query.clarity as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const polish = query.polish ? (query.polish as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const symmetry = query.symmetry ? (query.symmetry as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const labs = query.lab ? (query.lab as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const fluorescence = query.fluorescence ? (query.fluorescence as string).split(",").map(id => `${id.trim()}`).join(",") : "";

        const totalItems = await dbContext.query(
            `
                SELECT
                    diamond_list.id,
                    stock_id,
                    shape,
                    shape_name,
                    clarity,
                    clarity_name,
                    color,
                    color_name,
                    color_intensity,
                    color_intensity_name,
                    lab,
                    lab_name,
                    polish,
                    polish_name,
                    symmetry,
                    symmetry_name,
                    fluorescence,
                    fluorescence_name,
                    quantity,
                    weight,
                    report,
                    video,
                    image,
                    certificate,
                    measurement_height,
                    measurement_width,
                    measurement_depth,
                    table_value,
                    depth_value,
                    ratio,
                    user_comments,
                    admin_comments,
                    local_location,
                    status,
                    rate * ${currency} as rate,
                    company_id,
                    company_name,
                    is_active,
                    wishlist_products.id AS wishlist_id
                FROM
                    diamond_list
                    ${id ? `LEFT JOIN wishlist_products ON wishlist_products.product_id = diamond_list.id AND wishlist_products.user_id = '${id}'` : ''}
                WHERE
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE 
                            shape_name ILIKE '%${pagination.search_text}%'
                            OR clarity_name ILIKE '%${pagination.search_text}%'
                            OR color_name ILIKE '%${pagination.search_text}%'
                            OR color_intensity_name ILIKE '%${pagination.search_text}%'
                            OR stock_id ILIKE '%${pagination.search_text}%'
                            OR local_location ILIKE '%${pagination.search_text}%'
                            OR user_comments ILIKE '%${pagination.search_text}%'
                            OR admin_comments ILIKE '%${pagination.search_text}%'
                            OR ratio ILIKE '%${pagination.search_text}%'
                            OR CAST(quantity AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(weight AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(rate AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(report AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(table_value AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(depth_value AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(measurement_height AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(measurement_width AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(measurement_depth AS TEXT) ILIKE '%${pagination.search_text}%'
                        END
                            ${shapes ? `AND shape IN (${shapes})` : ""}
                            ${colors ? `AND color IN ${colors}` : ""}
                            ${color_intensity ? `AND color_intensity IN ${color_intensity}` : ""}
                            ${clarity ? `AND clarity IN ${clarity}` : ""}
                            ${polish ? `AND polish IN ${polish}` : ""}
                            ${symmetry ? `AND symmetry IN ${symmetry}` : ""}
                            ${labs ? `AND lab IN ${labs}` : ""}
                            ${fluorescence ? `AND fluorescence IN ${fluorescence}` : ""}
                            ${query.company ? `AND company_id = ${query.company}` : ""}
                            ${query.status ? `AND status = ${query.status}` : ""}
                            ${query.min_rate && query.max_rate ? `AND rate * ${currency} BETWEEN ${query.min_rate} AND ${query.max_rate}` : ""}
                            ${query.min_rate && !query.max_rate ? `AND rate * ${currency} >= ${query.min_rate}` : ""}
                            ${!query.min_rate && query.max_rate ? `AND rate * ${currency} <= ${query.max_rate}` : ""}
                            ${query.min_weight && query.max_weight ? `AND weight BETWEEN ${query.min_weight} AND ${query.max_weight}` : ""}
                            ${query.min_weight && !query.max_weight ? `AND weight >= ${query.min_weight}` : ""}
                            ${!query.min_weight && query.max_weight ? `AND weight <= ${query.max_weight}` : ""}
                            ${query.min_depth_value && query.max_depth_value ? `AND depth_value BETWEEN ${query.min_depth_value} AND ${query.max_depth_value}` : ""}
                            ${query.min_depth_value && !query.max_depth_value ? `AND depth_value >= ${query.min_depth_value}` : ""}
                            ${!query.min_depth_value && query.max_depth_value ? `AND depth_value <= ${query.max_depth_value}` : ""}
                            ${query.min_table_value && query.max_table_value ? `AND table_value BETWEEN ${query.min_table_value} AND ${query.max_table_value}` : ""}
                            ${query.min_table_value && !query.max_table_value ? `AND table_value >= ${query.min_table_value}` : ""}
                            ${!query.min_table_value && query.max_table_value ? `AND table_value <= ${query.max_table_value}` : ""}
                            ${query.min_measurement_height && query.max_measurement_height ? `AND measurement_height BETWEEN ${query.min_measurement_height} AND ${query.max_measurement_height}` : ""}
                            ${query.min_measurement_height && !query.max_measurement_height ? `AND measurement_height >= ${query.min_measurement_height}` : ""}
                            ${!query.min_measurement_height && query.max_measurement_height ? `AND measurement_height <= ${query.max_measurement_height}` : ""}
                            ${query.min_measurement_width && query.max_measurement_width ? `AND measurement_width BETWEEN ${query.min_measurement_width} AND ${query.max_measurement_width}` : ""}
                            ${query.min_measurement_width && !query.max_measurement_width ? `AND measurement_width >= ${query.min_measurement_width}` : ""}
                            ${!query.min_measurement_width && query.max_measurement_width ? `AND measurement_width <= ${query.max_measurement_width}` : ""}
                            ${query.min_measurement_depth && query.max_measurement_depth ? `AND measurement_depth BETWEEN ${query.min_measurement_depth} AND ${query.max_measurement_depth}` : ""}
                            ${query.min_measurement_depth && !query.max_measurement_depth ? `AND measurement_depth >= ${query.min_measurement_depth}` : ""}
                            ${!query.min_measurement_depth && query.max_measurement_depth ? `AND measurement_depth <= ${query.max_measurement_depth}` : ""}
                `,
            { type: QueryTypes.SELECT }
        )

        if (!noPagination) {
            if (totalItems.length === 0) {
                return resSuccess({ data: { pagination, result: [] } });
            }

            pagination.total_items = totalItems.length;
            pagination.total_pages = Math.ceil(totalItems.length / pagination.per_page_rows);
        }

        const diamondList = await dbContext.query(
            `
                SELECT
                    diamond_list.id,
                    stock_id,
                    shape,
                    shape_name,
                    clarity,
                    clarity_name,
                    color,
                    color_name,
                    color_intensity,
                    color_intensity_name,
                    lab,
                    lab_name,
                    polish,
                    polish_name,
                    symmetry,
                    symmetry_name,
                    fluorescence,
                    fluorescence_name,
                    quantity,
                    weight,
                    report,
                    video,
                    image,
                    certificate,
                    measurement_height,
                    measurement_width,
                    measurement_depth,
                    table_value,
                    depth_value,
                    ratio,
                    user_comments,
                    admin_comments,
                    local_location,
                    status,
                    rate * ${currency} as rate,
                    company_id,
                    company_name,
                    is_active,
                    wishlist_products.id AS wishlist_id
                FROM
                    diamond_list
                    ${id ? `LEFT JOIN wishlist_products ON wishlist_products.product_id = diamond_list.id AND wishlist_products.user_id = '${id}'` : ''}
                WHERE
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE 
                            shape_name ILIKE '%${pagination.search_text}%'
                            OR clarity_name ILIKE '%${pagination.search_text}%'
                            OR color_name ILIKE '%${pagination.search_text}%'
                            OR color_intensity_name ILIKE '%${pagination.search_text}%'
                            OR stock_id ILIKE '%${pagination.search_text}%'
                            OR local_location ILIKE '%${pagination.search_text}%'
                            OR user_comments ILIKE '%${pagination.search_text}%'
                            OR admin_comments ILIKE '%${pagination.search_text}%'
                            OR ratio ILIKE '%${pagination.search_text}%'
                            OR CAST(quantity AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(weight AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(rate AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(report AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(table_value AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(depth_value AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(measurement_height AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(measurement_width AS TEXT) ILIKE '%${pagination.search_text}%'
                            OR CAST(measurement_depth AS TEXT) ILIKE '%${pagination.search_text}%' END
            ${shapes ? `AND shape IN (${shapes})` : ""}
            ${colors ? `AND color IN ${colors}` : ""}
            ${color_intensity ? `AND color_intensity IN ${color_intensity}` : ""}
            ${clarity ? `AND clarity IN ${clarity}` : ""}
            ${polish ? `AND polish IN ${polish}` : ""}
            ${symmetry ? `AND symmetry IN ${symmetry}` : ""}
            ${labs ? `AND lab IN ${labs}` : ""}
            ${fluorescence ? `AND fluorescence IN ${fluorescence}` : ""}
            ${query.company ? `AND company_id = ${query.company}` : ""}
            ${query.status ? `AND status = ${query.status}` : ""}
            ${query.min_rate && query.max_rate ? `AND rate * ${currency} BETWEEN ${query.min_rate} AND ${query.max_rate}` : ""}
            ${query.min_rate && !query.max_rate ? `AND rate * ${currency} >= ${query.min_rate}` : ""}
            ${!query.min_rate && query.max_rate ? `AND rate * ${currency} <= ${query.max_rate}` : ""}
            ${query.min_weight && query.max_weight ? `AND weight BETWEEN ${query.min_weight} AND ${query.max_weight}` : ""}
            ${query.min_weight && !query.max_weight ? `AND weight >= ${query.min_weight}` : ""}
            ${!query.min_weight && query.max_weight ? `AND weight <= ${query.max_weight}` : ""}
            ${query.min_depth_value && query.max_depth_value ? `AND depth_value BETWEEN ${query.min_depth_value} AND ${query.max_depth_value}` : ""}
            ${query.min_depth_value && !query.max_depth_value ? `AND depth_value >= ${query.min_depth_value}` : ""}
            ${!query.min_depth_value && query.max_depth_value ? `AND depth_value <= ${query.max_depth_value}` : ""}
            ${query.min_table_value && query.max_table_value ? `AND table_value BETWEEN ${query.min_table_value} AND ${query.max_table_value}` : ""}
            ${query.min_table_value && !query.max_table_value ? `AND table_value >= ${query.min_table_value}` : ""}
            ${!query.min_table_value && query.max_table_value ? `AND table_value <= ${query.max_table_value}` : ""}
            ${query.min_measurement_height && query.max_measurement_height ? `AND measurement_height BETWEEN ${query.min_measurement_height} AND ${query.max_measurement_height}` : ""}
            ${query.min_measurement_height && !query.max_measurement_height ? `AND measurement_height >= ${query.min_measurement_height}` : ""}
            ${!query.min_measurement_height && query.max_measurement_height ? `AND measurement_height <= ${query.max_measurement_height}` : ""}
            ${query.min_measurement_width && query.max_measurement_width ? `AND measurement_width BETWEEN ${query.min_measurement_width} AND ${query.max_measurement_width}` : ""}
            ${query.min_measurement_width && !query.max_measurement_width ? `AND measurement_width >= ${query.min_measurement_width}` : ""}
            ${!query.min_measurement_width && query.max_measurement_width ? `AND measurement_width <= ${query.max_measurement_width}` : ""}
            ${query.min_measurement_depth && query.max_measurement_depth ? `AND measurement_depth BETWEEN ${query.min_measurement_depth} AND ${query.max_measurement_depth}` : ""}
            ${query.min_measurement_depth && !query.max_measurement_depth ? `AND measurement_depth >= ${query.min_measurement_depth}` : ""}
            ${!query.min_measurement_depth && query.max_measurement_depth ? `AND measurement_depth <= ${query.max_measurement_depth}` : ""}
                    ORDER BY ${pagination.sort_by} ${pagination.order_by}
                    OFFSET
                      ${(pagination.current_page - 1) * pagination.per_page_rows} ROWS
                      FETCH NEXT ${pagination.per_page_rows} ROWS ONLY
            `,
            { type: QueryTypes.SELECT }
        )

        return resSuccess({
            data: noPagination ? { result: totalItems } : { pagination, result: diamondList }
        })
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const getStockDetail = async (req: Request) => {
    try {
        const { stock_id } = req.params
        const { id } = req.body.session_res;
        const currency = await getCurrencyPrice(req.query.currency as string);

        const diamond = await dbContext.query(
            `SELECT
                    diamond_list.id,
                    stock_id,
                    shape,
                    shape_name,
                    clarity,
                    clarity_name,
                    color,
                    color_name,
                    color_intensity,
                    color_intensity_name,
                    lab,
                    lab_name,
                    polish,
                    polish_name,
                    symmetry,
                    symmetry_name,
                    fluorescence,
                    fluorescence_name,
                    quantity,
                    weight,
                    report,
                    video,
                    image,
                    certificate,
                    measurement_height,
                    measurement_width,
                    measurement_depth,
                    table_value,
                    depth_value,
                    ratio,
                    user_comments,
                    admin_comments,
                    local_location,
                    status,
                    rate * ${currency} as rate,
                    company_id,
                    company_name,
                    is_active,
                    wishlist_products.id AS wishlist_id
                FROM
                    diamond_list
                    ${id ? `LEFT JOIN wishlist_products ON wishlist_products.product_id = diamond_list.id AND wishlist_products.user_id = '${id}'` : ''} 
                    WHERE diamond_list.id = ${stock_id}`, { type: QueryTypes.SELECT }
        )
        return resSuccess({
            data: diamond[0]
        })
    } catch (error) {
        throw error;
    }
}