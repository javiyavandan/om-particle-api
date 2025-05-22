import { Request } from "express"
import Customer from "../../model/customer.modal"
import AppUser from "../../model/app_user.model"
import { ActiveStatus, DeleteStatus, Memo_Invoice_creation, StockStatus, UserVerification } from "../../utils/app-enumeration"
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, refreshMaterializedViews, resBadRequest, resErrorDataExit, resNotFound, resSuccess } from "../../utils/shared-functions"
import { DATA_ALREADY_EXITS, DUPLICATE_ERROR_CODE, ERROR_NOT_FOUND, RECORD_DELETED, STATUS_UPDATED } from "../../utils/app-messages"
import { generateRandomKey, statusUpdateValue } from "../../helpers/helper"
import dbContext from "../../config/dbContext"
import Apis from "../../model/apis"
import Diamonds from "../../model/diamond.model"
import Company from "../../model/companys.model"
import ApiStockDetails from "../../model/api-stock-details"
import { Op, QueryTypes, Sequelize } from "sequelize"
import { memoCreation } from "./memo.service"
import { invoiceCreation } from "./invoice.service"

export const createApi = async (req: Request) => {
    let trn;
    try {
        const { customer_id, column_array, stock_list, company_id, session_res } = req.body
        const stockError: string[] = [];
        const detailList = [];

        const findCustomer = await Customer.findOne({
            where: {
                id: customer_id,
            },
            attributes: ["id"],
            include: [
                {
                    model: AppUser,
                    as: 'user',
                    where: {
                        is_deleted: DeleteStatus.No,
                        is_active: ActiveStatus.Active,
                        is_verified: UserVerification.Admin_Verified
                    },
                    attributes: ["is_deleted", "is_active", "is_verified"]
                }
            ]
        })

        if (!(findCustomer && findCustomer?.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Customer"]])
            })
        }

        const findCompany = await Company.findOne({
            where: {
                id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active,
            }
        })

        if (!(findCompany && findCompany.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Company"]])
            })
        }

        const duplicateApi = await Apis.findOne({
            where: {
                customer_id,
                company_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ["customer_id", "company_id"]
        })

        if (duplicateApi && duplicateApi.dataValues) {
            return resErrorDataExit({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [["field_name", "Api with this customer and company"]])
            })
        }

        const api_key = await generateRandomKey(32)

        trn = await dbContext.transaction();

        const apiPayload = {
            api_key,
            column_array,
            customer_id,
            company_id,
            is_active: ActiveStatus.Active,
            is_deleted: DeleteStatus.No,
            created_at: getLocalDate(),
            created_by: session_res.id
        }

        const apiCreation = await Apis.create(apiPayload, { transaction: trn })

        const stockList = await Diamonds.findAll({
            where: {
                company_id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active,
                status: StockStatus.AVAILABLE,
            },
            attributes: ["stock_id", "company_id", "is_deleted", "is_active", "status", "id"]
        })

        for (let i = 0; i < stock_list.length; i++) {
            const stock: {
                stock_id: string,
                price: number
            } = stock_list[i];

            const findStock = stockList.find((item) => item.dataValues?.stock_id === stock.stock_id)

            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stock.stock_id} Stock`]]))
                continue;
            } else {
                detailList.push({
                    stock_id: findStock?.dataValues?.id,
                    price: stock.price,
                    api_id: apiCreation.dataValues.id
                })
            }
        }

        await ApiStockDetails.bulkCreate(detailList, { transaction: trn })

        await trn.commit();
        await refreshMaterializedViews()
        return resSuccess();

    } catch (error) {
        if (trn) {
            trn.rollback()
        }
        throw error
    }
}

export const updateApi = async (req: Request) => {
    let trn;
    try {
        const { api_id } = req.params
        const { stock_list, session_res, remove_list, column_array = [] } = req.body
        const stockError: string[] = [];
        const detailList = [];
        const removeStock = [];
        const updateDetailList = [];

        const findApi = await Apis.findOne({
            where: {
                id: api_id,
                is_deleted: DeleteStatus.No,
            }
        })

        if (!(findApi && findApi.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Api"]])
            })
        }

        const stockList = await Diamonds.findAll({
            where: {
                company_id: findApi.dataValues?.company_id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active,
            },
            attributes: ["stock_id", "company_id", "is_deleted", "is_active", "status", "id"]
        })

        const apiStockDetail = await ApiStockDetails.findAll({
            where: {
                api_id: findApi.dataValues?.id
            }
        })

        for (let i = 0; i < stock_list.length; i++) {
            const stock = stock_list[i];

            const findStock = stockList.find((item) => item.dataValues?.stock_id === stock.stock_id && item.dataValues?.status === StockStatus.AVAILABLE)

            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stock.stock_id} Stock`]]) + "from stock list")
                continue;
            } else {
                const findInDetail = apiStockDetail.find((item) => item.dataValues?.stock_id === findStock.dataValues?.id)

                if (findInDetail && findInDetail?.dataValues) {
                    updateDetailList.push({
                        id: findInDetail.dataValues?.id,
                        stock_id: findStock?.dataValues?.id,
                        price: stock.price,
                        api_id: findApi.dataValues.id
                    })
                } else {
                    detailList.push({
                        stock_id: findStock?.dataValues?.id,
                        price: stock.price,
                        api_id: findApi.dataValues.id
                    })
                }
            }
        }

        for (let i = 0; i < remove_list.length; i++) {
            const remove = remove_list[i];
            const findStockId = stockList.find((item) => item.dataValues?.stock_id === remove)
            const apiDetail = apiStockDetail?.find((item) => item.dataValues?.stock_id === findStockId?.dataValues?.id)
            if (!(apiDetail && apiDetail?.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${remove} Stock`]]) + "from remove list")
                continue;
            } else {
                removeStock.push(apiDetail?.dataValues?.id)
            }
        }

        trn = await dbContext.transaction();

        if (column_array && column_array?.length > 0) {
            await Apis.update({
                column_array,
                modified_at: getLocalDate(),
                modified_by: session_res.id,
            }, {
                where: {
                    id: api_id,
                }
            })
        }

        await ApiStockDetails.bulkCreate(detailList, { transaction: trn })

        if (updateDetailList?.length > 0) {
            await ApiStockDetails.bulkCreate(updateDetailList, {
                transaction: trn,
                updateOnDuplicate: [
                    "price",
                ]
            })
        }

        await ApiStockDetails.destroy({
            where: {
                id: {
                    [Op.in]: removeStock
                }
            },
            transaction: trn
        })

        await trn.commit();
        await refreshMaterializedViews()
        return resSuccess();

    } catch (error) {
        if (trn) {
            trn.rollback();
        }
        throw error
    }
}

export const updateStatus = async (req: Request) => {
    try {
        const { api_id } = req.params;

        const findApi = await Apis.findOne({
            where: {
                id: api_id,
                is_deleted: DeleteStatus.No,
            }
        })

        if (!(findApi && findApi?.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Api"]])
            })
        }

        await Apis.update({
            is_active: statusUpdateValue(findApi),
            modified_at: getLocalDate(),
            modified_by: req.body.session_res.id
        }, {
            where: {
                id: api_id
            }
        })

        await refreshMaterializedViews()
        return resSuccess({ message: STATUS_UPDATED })

    } catch (error) {
        throw error
    }
}

export const deleteApi = async (req: Request) => {
    try {
        const { api_id } = req.params;

        const findApi = await Apis.findOne({
            where: {
                id: api_id,
                is_deleted: DeleteStatus.No,
            }
        })

        if (!(findApi && findApi?.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Api"]])
            })
        }

        await Apis.update({
            is_deleted: DeleteStatus.Yes,
            deleted_at: getLocalDate(),
            deleted_by: req.body.session_res.id
        }, {
            where: {
                id: api_id
            }
        })
        await refreshMaterializedViews()
        return resSuccess({ message: RECORD_DELETED })

    } catch (error) {
        throw error
    }
}

export const getAllApi = async (req: Request) => {
    try {
        const { query } = req;
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text ?? "0",
        };
        let noPagination = req.query.no_pagination === "1";

        const totalItems = await dbContext.query(
            `
                SELECT * FROM api_list
                WHERE 
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE
                            customer_name ILIKE '%${pagination.search_text}%'
                            OR api_key ILIKE '%${pagination.search_text}%'
                END
                    ${req.body.session_res.id_role != 0 ? `AND company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND company_id = ${query.company}` : ""}`}
                    ORDER BY ${pagination.sort_by} ${pagination.order_by}
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

        const result = await dbContext.query(
            `
                SELECT * FROM api_list
                WHERE 
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE
                            customer_name ILIKE '%${pagination.search_text}%'
                            OR api_key ILIKE '%${pagination.search_text}%'
                END
                    ${req.body.session_res.id_role != 0 ? `AND company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND company_id = ${query.company}` : ""}`}
                    ORDER BY ${pagination.sort_by} ${pagination.order_by}
                    OFFSET
                      ${(pagination.current_page - 1) * pagination.per_page_rows} ROWS
                      FETCH NEXT ${pagination.per_page_rows} ROWS ONLY
            `,
            { type: QueryTypes.SELECT }
        )

        return resSuccess({
            data: noPagination ? totalItems : { pagination, result }
        })

    } catch (error) {
        throw error
    }
}

export const getApiDetails = async (req: Request) => {
    try {
        const { api_id } = req.params;
        const result = await dbContext.query(
            `SELECT * FROM api_list WHERE id = ${api_id}`, { type: QueryTypes.SELECT }
        )

        if (!result[0]) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Api"]])
            })
        }

        return resSuccess({
            data: result[0]
        })
    } catch (error) {
        throw error
    }
}

export const getStockListApiForCustomer = async (req: Request) => {
    try {
        const { api_key } = req.params
        const { query } = req;
        const {
            shape,
            color,
            clarity,
            color_intensity,
            lab,
            polish,
            symmetry,
            fluorescence,
            min_weight,
            max_weight,
            min_rate,
            max_rate,
            min_measurement_height,
            max_measurement_height,
            min_measurement_width,
            max_measurement_width,
            min_measurement_depth,
            max_measurement_depth,
        }: any = query

        const shapeValue = shape?.split(",")
        const colorValue = color?.split(",")
        const clarityValue = clarity?.split(",")
        const colorIntensityValue = color_intensity?.split(",")
        const labValue = lab?.split(",")
        const polishValue = polish?.split(",")
        const symmetryValue = symmetry?.split(",")
        const fluorescenceValue = fluorescence?.split(",")

        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text ?? "0",
        };
        let noPagination = req.query.no_pagination === "1";

        const findApi = await Apis.findOne({
            where: {
                api_key,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        if (!(findApi && findApi.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Api"]])
            })
        }

        const column = findApi?.dataValues?.column_array?.map((item: string) => {
            return `elem->>'${item}' AS ${item}`
        })

        const ilikeAnyClause = (key: string, arr?: string[]) =>
            arr?.length ? `AND elem->>'${key}' ILIKE ANY (ARRAY[:${key}]::text[])` : ''
        const rangeClause = (key: string, min: any, max: any, min_key: string, max_key: string) => `
            ${min && max ? `AND (elem->>'${key}')::NUMERIC BETWEEN :${min_key} AND :${max_key}` : ""}
            ${min && !max ? `AND (elem->>'${key}')::NUMERIC >= :${min_key}` : ""}
            ${!min && max ? `AND (elem->>'${key}')::NUMERIC <= :${max_key}` : ""}
        `

        const generatingFilter = () => `
                    ${ilikeAnyClause("shape_name", shapeValue)}
                    ${ilikeAnyClause("color_name", colorValue)}
                    ${ilikeAnyClause("clarity_name", clarityValue)}
                    ${ilikeAnyClause("color_intensity_name", colorIntensityValue)}
                    ${ilikeAnyClause("lab_name", labValue)}
                    ${ilikeAnyClause("polish_name", polishValue)}
                    ${ilikeAnyClause("symmetry_name", symmetryValue)}
                    ${ilikeAnyClause("fluorescence_name", fluorescenceValue)}
                    ${rangeClause("weight", min_weight, max_weight, "min_weight", "max_weight")}
                    ${rangeClause("rate", min_rate, max_rate, "min_rate", "max_rate")}
                    ${rangeClause("measurement_height", min_measurement_height, max_measurement_height, "min_measurement_height", "max_measurement_height")}
                    ${rangeClause("measurement_width", min_measurement_width, max_measurement_width, "min_measurement_width", "max_measurement_width")}
                    ${rangeClause("measurement_depth", min_measurement_depth, max_measurement_depth, "min_measurement_depth", "max_measurement_depth")}
        `

        const replacements = {
            id: findApi?.dataValues?.id,
            shape: shapeValue?.map((s: any) => `%${s}%`) ?? [],
            color: colorValue?.map((s: any) => `%${s}%`) ?? [],
            clarity: clarityValue?.map((s: any) => `%${s}%`) ?? [],
            color_intensity: colorIntensityValue?.map((s: any) => `%${s}%`) ?? [],
            lab: labValue?.map((s: any) => `%${s}%`) ?? [],
            polish: polishValue?.map((s: any) => `%${s}%`) ?? [],
            symmetry: symmetryValue?.map((s: any) => `%${s}%`) ?? [],
            fluorescence: fluorescenceValue?.map((s: any) => `%${s}%`) ?? [],
            min_weight,
            max_weight,
            min_rate,
            max_rate,
            min_measurement_height,
            max_measurement_height,
            min_measurement_width,
            max_measurement_width,
            min_measurement_depth,
            max_measurement_depth
        }

        const totalItems = await dbContext.query(
            `
                SELECT
                    ${column?.map((item: string) => item)}
                FROM api_list,
                        LATERAL json_array_elements(api_list.stock_details) AS elem
                WHERE api_list.id = :id
                    ${generatingFilter()}
                ORDER BY ${pagination.sort_by} ${pagination.order_by}
            `,
            {
                replacements: replacements,
                type: QueryTypes.SELECT
            }
        )

        if (!noPagination) {
            if (totalItems.length === 0) {
                return resSuccess({ data: { pagination, result: [] } });
            }

            pagination.total_items = totalItems.length;
            pagination.total_pages = Math.ceil(totalItems.length / pagination.per_page_rows);
        }

        const result = await dbContext.query(
            `
                SELECT
                    ${column?.map((item: string) => item)}
                FROM api_list,
                        LATERAL json_array_elements(api_list.stock_details) AS elem
                WHERE api_list.id = :id
                    ${generatingFilter()}
                ORDER BY ${pagination.sort_by} ${pagination.order_by}
                    OFFSET
                      ${(pagination.current_page - 1) * pagination.per_page_rows} ROWS
                      FETCH NEXT ${pagination.per_page_rows} ROWS ONLY
            `,
            {
                replacements: replacements,
                type: QueryTypes.SELECT
            }
        )

        return resSuccess({
            data: noPagination ? totalItems : { pagination, result }
        })

    } catch (error) {
        throw error
    }
}

export const checkStockStatusApi = async (req: Request) => {
    try {
        const { api_key, stock_id } = req.params;

        const findApi = await Apis.findOne({
            where: {
                api_key,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        if (!(findApi && findApi?.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Api"]])
            })
        }

        const findStock = await Diamonds.findOne({
            where: {
                stock_id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        if (!(findStock && findStock?.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]])
            })
        }

        const findStockInDetail = await ApiStockDetails.findOne({
            where: {
                stock_id: findStock?.dataValues?.id,
                api_id: findApi?.dataValues?.id
            }
        })

        if (!(findStockInDetail && findStockInDetail?.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]])
            })
        }

        if (findStock?.dataValues?.status === StockStatus.MEMO || findStock?.dataValues?.status === StockStatus.SOLD) {
            return resBadRequest({
                message: "Stock is not available"
            })
        } else {
            return resSuccess({
                message: "Stock is available"
            })
        }

    } catch (error) {
        throw error
    }
}

export const updateStockStatusFromCustomer = async (req: Request) => {
    try {
        const { api_key, status } = req.params
        const { stock_list } = req.body
        const stockError: string[] = []
        const stocks = [];

        const findApi = await Apis.findOne({
            where: {
                api_key,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        if (!(findApi && findApi?.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Api"]])
            })
        }

        const stockList = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active,
                status: StockStatus.AVAILABLE
            }
        })

        const apiStockDetailList = await ApiStockDetails.findAll({
            where: {
                api_id: findApi?.dataValues?.id
            }
        })

        for (let i = 0; i < stock_list.length; i++) {
            const stock = stock_list[i];
            const findStockFromList = stockList?.find((item) => item?.dataValues?.stock_id === stock)
            if (!(findStockFromList && findStockFromList.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]]))
                continue;
            } else {
                const findStockInDetail = apiStockDetailList?.find((item) => item?.dataValues?.stock_id === findStockFromList.dataValues?.id)
                if (!(findStockInDetail && findStockInDetail)) {
                    stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]]))
                    continue;
                } else {
                    stocks.push({
                        stock_id: findStockFromList?.dataValues?.stock_id,
                        rate: findStockInDetail?.dataValues?.price,
                        weight: findStockFromList?.dataValues?.weight,
                        quantity: findStockFromList?.dataValues?.quantity,
                    })
                }
            }
        }

        const apiAdmin = await AppUser.findOne({
            where: {
                email: "apicustomer@gmail.com"
            },
            attributes: ["id"]
        })

        const payload = {
            company_id: findApi?.dataValues?.company_id,
            memo_creation_type: Memo_Invoice_creation.Single,
            invoice_creation_type: Memo_Invoice_creation.Single,
            customer_id: findApi?.dataValues?.customer_id,
            remarks: "",
            contact: "",
            salesperson: "",
            ship_via: "",
            report_date: "",
            cust_order: "",
            tracking: "",
            stock_list: stocks,
            session_res: {
                id_role: 0,
                id: apiAdmin?.dataValues?.id
            }
        }

        if (status === StockStatus.MEMO) {
            const data = await memoCreation(payload)
            return data
        }

        if (status === StockStatus.SOLD) {
            const data = await invoiceCreation(payload)
            return data
        }

    } catch (error) {
        throw error
    }
}