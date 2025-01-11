import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, refreshMaterializedDiamondListView, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
import { DATA_ALREADY_EXITS, DUPLICATE_ERROR_CODE, DUPLICATE_VALUE_ERROR_MESSAGE, ERROR_NOT_FOUND, RECORD_UPDATE } from "../../utils/app-messages";
import Master from "../../model/masters.model";
import { ActiveStatus, DeleteStatus, Master_type, StockStatus } from "../../utils/app-enumeration";
import Company from "../../model/companys.model";
import { Op, QueryTypes, Sequelize } from "sequelize";
import dbContext from "../../config/dbContext";

export const addStock = async (req: Request) => {
    try {
        const {
            stock_id,
            status,
            shape,
            quantity,
            weight,
            rate,
            color,
            color_intensity,
            clarity,
            lab,
            report,
            polish,
            symmetry,
            video,
            image,
            certificate,
            measurement_height,
            measurement_depth,
            measurement_width,
            table_value,
            depth_value,
            ratio,
            fluorescence,
            company_id,
            user_comments,
            admin_comments,
            local_location,
            session_res
        } = req.body

        const findDiamond = await Diamonds.findOne({
            where: {
                stock_id: stock_id,
                is_deleted: DeleteStatus.No
            }
        })

        const MastersData = await Master.findAll({
            where: {
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })

        const shapeData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Stone_shape && item.dataValues.id === shape)
        const colorData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Diamond_color && item.dataValues.id === color)
        const clarityData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Diamond_clarity && item.dataValues.id === clarity)
        const labData: any = MastersData.find(item => item.dataValues.master_type === Master_type.lab && item.dataValues.id === lab)
        const polishData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Polish && item.dataValues.id === polish)
        const symmetryData: any = MastersData.find(item => item.dataValues.master_type === Master_type.symmetry && item.dataValues.id === symmetry)
        const colorIntensityData: any = MastersData.find(item => item.dataValues.master_type === Master_type.colorIntensity && item.dataValues.id === color_intensity)
        const fluorescenceData: any = MastersData.find(item => item.dataValues.master_type === Master_type.fluorescence && item.dataValues.id === fluorescence)
        const companyData: any = await Company.findOne({
            where: {
                id: company_id,
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })

        // Check for missing fields
        const missingFields = [];
        if (!(shapeData && shapeData.dataValues)) missingFields.push("Shape Data");
        if (!(colorData && colorData.dataValues)) missingFields.push("Color Data");
        if (!(clarityData && clarityData.dataValues)) missingFields.push("Clarity Data");
        if (!(labData && labData.dataValues)) missingFields.push("Lab Data");
        if (!(polishData && polishData.dataValues)) missingFields.push("Polish Data");
        if (!(symmetryData && symmetryData.dataValues)) missingFields.push("Symmetry Data");
        if (!(colorIntensityData && colorIntensityData.dataValues)) missingFields.push("Color Intensity Data");
        if (!(companyData && companyData.dataValues)) missingFields.push("Location Data");
        if (fluorescence) if (!(fluorescenceData && fluorescenceData.dataValues)) missingFields.push("fluorescence Data");

        // If there are missing fields, return an appropriate response
        if (missingFields.length > 0) {
            return resNotFound({
                data: missingFields.map((field) => prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", field]]))
            });
        }

        if (findDiamond && findDiamond.dataValues) {
            return resNotFound({
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [["field_name", "Diamond"]]),
            })
        }

        await Diamonds.create({
            stock_id: stock_id,
            status: status,
            is_active: ActiveStatus.Active,
            is_deleted: DeleteStatus.No,
            shape: shape,
            quantity: quantity,
            weight: weight,
            rate: rate,
            color: color,
            color_intensity: color_intensity,
            clarity: clarity,
            lab: lab,
            report: report,
            polish: polish,
            symmetry: symmetry,
            video: video,
            image: image,
            certificate: certificate,
            measurement_height,
            measurement_width,
            measurement_depth,
            local_location,
            table_value: table_value,
            depth_value: depth_value,
            ratio: ratio,
            fluorescence: fluorescence,
            company_id: company_id,
            user_comments,
            admin_comments,
            created_by: session_res.id,
            created_at: getLocalDate(),
        })

        await refreshMaterializedDiamondListView()

        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const updateStock = async (req: Request) => {
    try {
        const {
            stock_id,
            available,
            is_active,
            is_deleted,
            shape,
            quantity,
            weight,
            rate,
            color,
            color_intensity,
            clarity,
            lab,
            report,
            polish,
            symmetry,
            video,
            image,
            certificate,
            measurement_height,
            measurement_width,
            measurement_depth,
            table_value,
            depth_value,
            ratio,
            fluorescence,
            company_id,
            user_comments,
            admin_comments,
            local_location,
            session_res
        } = req.body
        const { diamond_id } = req.params

        const diamond = await Diamonds.findOne({
            where: {
                is_deleted: DeleteStatus.No,
                id: diamond_id
            }
        })

        if (!(diamond && diamond.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond"]]),
            })
        }

        const duplicateDiamond = await Diamonds.findOne({
            where: {
                is_deleted: DeleteStatus.No,
                id: { [Op.ne]: diamond.dataValues.id },
                stock_id: stock_id
            }
        })

        if (duplicateDiamond && duplicateDiamond.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DUPLICATE_VALUE_ERROR_MESSAGE, [
                    ["field_name", "Diamond"],
                ]),
            });
        }

        const MastersData = await Master.findAll({
            where: {
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })

        const shapeData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Stone_shape && item.dataValues.id === shape)
        const colorData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Diamond_color && item.dataValues.id === color)
        const clarityData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Diamond_clarity && item.dataValues.id === clarity)
        const labData: any = MastersData.find(item => item.dataValues.master_type === Master_type.lab && item.dataValues.id === lab)
        const polishData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Polish && item.dataValues.id === polish)
        const symmetryData: any = MastersData.find(item => item.dataValues.master_type === Master_type.symmetry && item.dataValues.id === symmetry)
        const colorIntensityData: any = MastersData.find(item => item.dataValues.master_type === Master_type.colorIntensity && item.dataValues.id === color_intensity)
        const fluorescenceData: any = MastersData.find(item => item.dataValues.master_type === Master_type.fluorescence && item.dataValues.id === fluorescence)
        const companyData: any = await Company.findOne({
            where: {
                id: company_id,
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })

        // Check for missing fields
        const missingFields = [];
        if (!(shapeData && shapeData.dataValues)) missingFields.push("Shape Data");
        if (!(colorData && colorData.dataValues)) missingFields.push("Color Data");
        if (!(clarityData && clarityData.dataValues)) missingFields.push("Clarity Data");
        if (!(labData && labData.dataValues)) missingFields.push("Lab Data");
        if (!(polishData && polishData.dataValues)) missingFields.push("Polish Data");
        if (!(symmetryData && symmetryData.dataValues)) missingFields.push("Symmetry Data");
        if (!(colorIntensityData && colorIntensityData.dataValues)) missingFields.push("Color Intensity Data");
        if (!(companyData && companyData.dataValues)) missingFields.push("Location Data");
        if (fluorescence) if (!(fluorescenceData && fluorescenceData.dataValues)) missingFields.push("fluorescence Data");

        // If there are missing fields, return an appropriate response
        if (missingFields.length > 0) {
            return resNotFound({
                data: missingFields.map((field) => prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", field]]))
            });
        }

        await Diamonds.update({
            stock_id: stock_id,
            available: available,
            is_active: is_active,
            is_deleted: is_deleted,
            shape: shape,
            quantity: quantity,
            weight: weight,
            rate: rate,
            color: color,
            color_intensity: color_intensity,
            clarity: clarity,
            lab: lab,
            report: report,
            polish: polish,
            symmetry: symmetry,
            video: video,
            image: image,
            certificate: certificate,
            measurement_height,
            measurement_width,
            measurement_depth,
            local_location,
            table_value: table_value,
            depth_value: depth_value,
            ratio: ratio,
            fluorescence: fluorescence,
            company_id: company_id,
            user_comments,
            admin_comments,
            modified_by: session_res.id,
            modified_at: getLocalDate(),
        }, {
            where: {
                id: diamond.dataValues.id
            }
        })
        await refreshMaterializedDiamondListView()

        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const deleteStock = async (req: Request) => {
    try {
        const { diamond_id } = req.params

        const findDiamond = await Diamonds.findOne({
            where: {
                id: diamond_id,
                is_deleted: DeleteStatus.No,
                status: {
                    [Op.ne]: StockStatus.MEMO
                }
            }
        })
        if (!(findDiamond && findDiamond.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond"]]),
            })
        }

        await Diamonds.update({
            is_deleted: DeleteStatus.Yes,
            deleted_at: getLocalDate(),
            deleted_by: req.body.session_res.id,
        }, {
            where: {
                id: findDiamond.dataValues.id
            }
        })
        await refreshMaterializedDiamondListView()
        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const getStock = async (req: Request) => {
    try {
        const { diamond_id } = req.params

        const diamond = await dbContext.query(
            `SELECT * FROM diamond_list WHERE id = ${diamond_id}`, { type: QueryTypes.SELECT }
        )

        return resSuccess({
            data: diamond[0]
        })
    } catch (error) {
        throw error;
    }
}

export const getAllStock = async (req: Request) => {
    try {
        const { query } = req;
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text ?? "0",
        };
        let noPagination = req.query.no_pagination === "1";
        const shapes = query.shape ? (query.shape as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const colors = query.color ? (query.color as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const color_intensity = query.color_intensity ? (query.color_intensity as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const clarity = query.clarity ? (query.clarity as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const polish = query.polish ? (query.polish as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const symmetry = query.symmetry ? (query.symmetry as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const labs = query.lab ? (query.lab as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const customer = query.customer ? (query.customer as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const fluorescence = query.fluorescence ? (query.fluorescence as string).split(",").map(id => `${id.trim()}`).join(",") : "";

        const totalItems = await dbContext.query(
            `
                SELECT
                    *
                FROM
                    diamond_list
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
                            OR customer_name ILIKE '%${pagination.search_text}%'
                            OR first_name ILIKE '%${pagination.search_text}%'
                            OR last_name ILIKE '%${pagination.search_text}%'
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
                            ${customer ? `AND customer_id IN (${customer})` : ""}
                            ${req.body.session_res.id_role != 0 ? `AND company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND company_id = ${query.company}` : ""}`}
                            ${query.status ? `AND status = '${query.status}' ` : ""}
                            ${query.min_rate && query.max_rate ? `AND rate BETWEEN ${query.min_rate} AND ${query.max_rate}` : ""}
                            ${query.min_rate && !query.max_rate ? `AND rate >= ${query.min_rate}` : ""}
                            ${!query.min_rate && query.max_rate ? `AND rate <= ${query.max_rate}` : ""}
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
                            ${query.start_date && query.end_date
                ? `AND created_at BETWEEN '${new Date(new Date(query.start_date as string).setMinutes(0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
                              ${query.start_date && !query.end_date
                ? `AND created_at >= '${new Date(new Date(query.start_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
                              ${!query.start_date && query.end_date
                ? `AND created_at <= '${new Date(new Date(query.end_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
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
                    *
                FROM
                    diamond_list
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
                            OR customer_name ILIKE '%${pagination.search_text}%'
                            OR first_name ILIKE '%${pagination.search_text}%'
                            OR last_name ILIKE '%${pagination.search_text}%'
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
                            ${customer ? `AND customer_id IN (${customer})` : ""}
                            ${req.body.session_res.id_role != 0 ? `AND company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND company_id = ${query.company}` : ""}`}
                            ${query.status ? `AND status = '${query.status}' ` : ""}
                            ${query.min_rate && query.max_rate ? `AND rate BETWEEN ${query.min_rate} AND ${query.max_rate}` : ""}
                            ${query.min_rate && !query.max_rate ? `AND rate >= ${query.min_rate}` : ""}
                            ${!query.min_rate && query.max_rate ? `AND rate <= ${query.max_rate}` : ""}
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
                            ${query.start_date && query.end_date
                ? `AND created_at BETWEEN '${new Date(new Date(query.start_date as string).setMinutes(0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
                              ${query.start_date && !query.end_date
                ? `AND created_at >= '${new Date(new Date(query.start_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
                              ${!query.start_date && query.end_date
                ? `AND created_at <= '${new Date(new Date(query.end_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
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

export const updateStockStatus = async (req: Request) => {
    try {
        const { diamond_id } = req.params

        const findDiamond = await Diamonds.findOne({
            where: {
                id: diamond_id,
                is_deleted: DeleteStatus.No,
            },
        })

        if (!(findDiamond && findDiamond.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond"]])
            })
        }

        await Diamonds.update({
            is_active: findDiamond.dataValues.is_active === ActiveStatus.InActive ? ActiveStatus.Active : ActiveStatus.InActive
        }, {
            where: {
                id: findDiamond.dataValues.id,
            },
        })

        await refreshMaterializedDiamondListView()
        return resSuccess({ message: RECORD_UPDATE })

    } catch (error) {
        throw error
    }
}