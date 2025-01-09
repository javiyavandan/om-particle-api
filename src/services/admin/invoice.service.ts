import { Request } from "express";
import dbContext from "../../config/dbContext";
import AppUser from "../../model/app_user.model";
import Company from "../../model/companys.model";
import Customer from "../../model/customer.modal";
import Diamonds from "../../model/diamond.model";
import InvoiceDetail from "../../model/invoice-detail.model";
import Invoice from "../../model/invoice.model";
import { DeleteStatus, ActiveStatus, UserVerification, StockStatus, MEMO_STATUS, Master_type } from "../../utils/app-enumeration";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import { resNotFound, prepareMessageFromParams, getLocalDate, resSuccess, resBadRequest, getInitialPaginationFromQuery, refreshMaterializedDiamondListView } from "../../utils/shared-functions";
import Master from "../../model/masters.model";
import { Sequelize, Op, QueryTypes } from "sequelize";
import Memo from "../../model/memo.model";
import MemoDetail from "../../model/memo-detail.model";

export const createInvoice = async (req: Request) => {
    try {
        const { company_id, customer_id, stock_list, memo_id, remarks } = req.body
        const stockError = [];
        const stockList: any = [];

        if (stock_list.length == 0) {
            return resBadRequest({
                message: "Please select stock"
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

        const taxFind = await Master.findAll({
            where: {
                master_type: Master_type.Tax,
                country_id: findCompany.dataValues.country_id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        if (!(taxFind && taxFind.length > 0)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Tax for this country was"]])
            })
        }

        const findCustomer = await Customer.findOne({
            where: {
                id: customer_id,
            },
            include: [
                {
                    model: AppUser,
                    as: 'user',
                    where: {
                        is_deleted: DeleteStatus.No,
                        is_active: ActiveStatus.Active,
                        is_verified: UserVerification.Admin_Verified
                    }
                }
            ]
        })

        if (!(findCustomer && findCustomer.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Customer"]])
            })
        }

        const allStock = await Diamonds.findAll({
            where: [
                { is_deleted: DeleteStatus.No },
                req.body.session_res.company_id ? { company_id: req.body.session_res.company_id } : {},
                {
                    status: {
                        [Op.ne]: StockStatus.SOLD
                    }
                }
            ]
        })

        for (let index = 0; index < stock_list.length; index++) {
            const stockId = stock_list[index].stock_id;
            const findStock = allStock.find(stock => stock.dataValues.stock_id === stockId)
            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else {
                stockList.push({
                    stock_id: findStock.dataValues.id,
                    stock_price: stock_list[index].rate,
                })
            }
        }

        if (stockError.length > 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]]),
                data: stockError.map(err => err)
            })
        }

        const trn = await dbContext.transaction();

        const invoiceList = await Invoice.findAll({
            where: {
                company_id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
            }
        })

        const invoiceNumber = invoiceList[invoiceList.length - 1] ? Number(invoiceList[invoiceList.length - 1].dataValues.invoice_number) + 1 : 1;
        try {
            const invoicePayload = {
                invoice_number: invoiceNumber,
                company_id: findCompany.dataValues.id,
                customer_id: findCustomer.dataValues.id,
                created_at: getLocalDate(),
                created_by: req.body.session_res.id,
                remarks,
            };

            const invoiceData = await Invoice.create(invoicePayload, {
                transaction: trn,
            });

            const invoiceId = invoiceData.dataValues.id;

            const stockListWithInvoiceId = stockList.map((stock: any) => ({
                ...stock,
                invoice_id: invoiceId,
            }));

            await InvoiceDetail.bulkCreate(stockListWithInvoiceId, {
                transaction: trn,
            })

            const stockUpdate = allStock.filter(stock => stockList.map((data: any) => data.stock_id).includes(stock.dataValues.id)).map(stock => ({
                ...stock.dataValues,
                status: StockStatus.SOLD
            }))

            await Diamonds.bulkCreate(stockUpdate, {
                updateOnDuplicate: [
                    "status"
                ],
                transaction: trn,
            })

            if (memo_id) {

                const memoDetail = await MemoDetail.findAll({
                    where: {
                        memo_id,
                        is_deleted: DeleteStatus.No,
                    },
                    attributes: [],
                    include: [
                        {
                            model: Diamonds,
                            as: "stocks",
                            where: [
                                {
                                    is_deleted: DeleteStatus.No,
                                    status: StockStatus.MEMO
                                }
                            ],
                            attributes: []
                        }
                    ],
                    transaction: trn,
                })

                if (memoDetail.length === 0) {
                    await Memo.update({
                        status: MEMO_STATUS.Close,
                    }, {
                        where: {
                            id: memo_id
                        }
                    })
                }
            }

            await trn.commit();
            await refreshMaterializedDiamondListView()

            return resSuccess()
        } catch (error) {
            await trn.rollback();
            throw error
        }

    } catch (error) {
        throw error
    }
}

export const getInvoice = async (req: Request) => {

    try {
        const { invoice_id } = req.params

        const invoice = await dbContext.query(
            `SELECT * FROM invoice_list WHERE id = ${invoice_id}`, { type: QueryTypes.SELECT }
        )

        return resSuccess({
            data: invoice[0]
        })

    } catch (error) {
        throw error
    }
}

export const getAllInvoice = async (req: Request) => {
    try {
        const { query } = req;
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text ?? "0",
        };
        let noPagination = req.query.no_pagination === "1";

        const totalItems = await dbContext.query(`
            SELECT * FROM invoice_list
            WHERE 
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE 
                CAST(invoice_list.invoice_number AS text) LIKE '%${pagination.search_text}%'
                OR invoice_list.company_name LIKE '%${pagination.search_text}%'
                OR invoice_list.state LIKE '%${pagination.search_text}%'
                OR invoice_list.remarks LIKE '%${pagination.search_text}%'
                OR invoice_list.country LIKE '%${pagination.search_text}%'
                OR invoice_list.city LIKE '%${pagination.search_text}%'
                OR invoice_list.customer_name LIKE '%${pagination.search_text}%'
                OR invoice_list.last_name LIKE '%${pagination.search_text}%'
                OR invoice_list.first_name LIKE '%${pagination.search_text}%'
                OR invoice_list.registration_number LIKE '%${pagination.search_text}%'
                OR invoice_list.email LIKE '%${pagination.search_text}%'
                OR invoice_list.phone_number LIKE '%${pagination.search_text}%'
            END
            ${query.customer ? `AND invoice_list.customer_id = ${query.customer}` : ''}
            ${query.company ? `AND invoice_list.company_id = '${query.company}'` : ''}
            ${query.lab ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'lab_id')::integer = ${query.lab}
            )` : ''}
            ${query.color ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'color_id')::integer = ${query.color}
            )` : ''}
            ${query.clarity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'clarity_id')::integer = ${query.clarity}
            )` : ''}
            ${query.color_intensity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'color_intensity_id')::integer = ${query.color_intensity}
            )` : ''}
            ${query.fluorescence ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'fluorescence_id')::integer = ${query.fluorescence}
            )` : ''}
            ${query.polish ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'polish_id')::integer = ${query.polish}
            )` : ''}
            ${query.symmetry ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'symmetry_id')::integer = ${query.symmetry}
            )` : ''}
            ${query.shape ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'shape_id')::integer = ${query.shape}
            )` : ''}
            ${query.start_date && query.end_date
                ? `AND invoice_list.created_at BETWEEN '${new Date(new Date(query.start_date as string).setMinutes(0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
              ${query.start_date && !query.end_date
                ? `AND invoice_list.created_at >= '${new Date(new Date(query.start_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
              ${!query.start_date && query.end_date
                ? `AND invoice_list.created_at <= '${new Date(new Date(query.end_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
                ${query.min_rate && query.max_rate ? `AND invoice_list.total_price BETWEEN ${query.min_rate} AND ${query.max_rate}` : ""}
                ${query.min_rate && !query.max_rate ? `AND invoice_list.total_price >= ${query.min_rate}` : ""}
                ${!query.min_rate && query.max_rate ? `AND invoice_list.total_price <= ${query.max_rate}` : ""}
                ${query.min_weight && query.max_weight ? `AND invoice_list.total_weight BETWEEN ${query.min_weight} AND ${query.max_weight}` : ""}
                ${query.min_weight && !query.max_weight ? `AND invoice_list.total_weight >= ${query.min_weight}` : ""}
                ${!query.min_weight && query.max_weight ? `AND invoice_list.total_weight <= ${query.max_weight}` : ""}
        `, { type: QueryTypes.SELECT });

        if (!noPagination) {
            if (totalItems.length === 0) {
                return resSuccess({ data: { pagination, result: [] } });
            }

            pagination.total_items = totalItems.length;
            pagination.total_pages = Math.ceil(totalItems.length / pagination.per_page_rows);
        }

        const invoiceList = await dbContext.query(`
            SELECT * FROM invoice_list
            WHERE 
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE 
                CAST(invoice_list.invoice_number AS text) LIKE '%${pagination.search_text}%'
                OR invoice_list.company_name LIKE '%${pagination.search_text}%'
                OR invoice_list.state LIKE '%${pagination.search_text}%'
                OR invoice_list.remarks LIKE '%${pagination.search_text}%'
                OR invoice_list.country LIKE '%${pagination.search_text}%'
                OR invoice_list.city LIKE '%${pagination.search_text}%'
                OR invoice_list.customer_name LIKE '%${pagination.search_text}%'
                OR invoice_list.last_name LIKE '%${pagination.search_text}%'
                OR invoice_list.first_name LIKE '%${pagination.search_text}%'
                OR invoice_list.registration_number LIKE '%${pagination.search_text}%'
                OR invoice_list.email LIKE '%${pagination.search_text}%'
                OR invoice_list.phone_number LIKE '%${pagination.search_text}%'
            END
            ${query.customer ? `AND invoice_list.customer_id = ${query.customer}` : ''}
            ${query.company ? `AND invoice_list.company_id = '${query.company}'` : ''}
            ${query.lab ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'lab_id')::integer = ${query.lab}
            )` : ''}
            ${query.color ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'color_id')::integer = ${query.color}
            )` : ''}
            ${query.clarity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'clarity_id')::integer = ${query.clarity}
            )` : ''}
            ${query.color_intensity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'color_intensity_id')::integer = ${query.color_intensity}
            )` : ''}
            ${query.fluorescence ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'fluorescence_id')::integer = ${query.fluorescence}
            )` : ''}
            ${query.polish ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'polish_id')::integer = ${query.polish}
            )` : ''}
            ${query.symmetry ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'symmetry_id')::integer = ${query.symmetry}
            )` : ''}
            ${query.shape ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'shape_id')::integer = ${query.shape}
            )` : ''}
            ${query.start_date && query.end_date
                ? `AND invoice_list.created_at BETWEEN '${new Date(new Date(query.start_date as string).setMinutes(0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
              ${query.start_date && !query.end_date
                ? `AND invoice_list.created_at >= '${new Date(new Date(query.start_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
              ${!query.start_date && query.end_date
                ? `AND invoice_list.created_at <= '${new Date(new Date(query.end_date as string).setMinutes(0, 0, 0)).toISOString()}'`
                : ""}
                ${query.min_rate && query.max_rate ? `AND invoice_list.total_price BETWEEN ${query.min_rate} AND ${query.max_rate}` : ""}
                ${query.min_rate && !query.max_rate ? `AND invoice_list.total_price >= ${query.min_rate}` : ""}
                ${!query.min_rate && query.max_rate ? `AND invoice_list.total_price <= ${query.max_rate}` : ""}
                ${query.min_weight && query.max_weight ? `AND invoice_list.total_weight BETWEEN ${query.min_weight} AND ${query.max_weight}` : ""}
                ${query.min_weight && !query.max_weight ? `AND invoice_list.total_weight >= ${query.min_weight}` : ""}
                ${!query.min_weight && query.max_weight ? `AND invoice_list.total_weight <= ${query.max_weight}` : ""}
                ORDER BY ${pagination.sort_by} ${pagination.order_by}
                OFFSET
                  ${(pagination.current_page - 1) * pagination.per_page_rows} ROWS
                  FETCH NEXT ${pagination.per_page_rows} ROWS ONLY
        `, { type: QueryTypes.SELECT });

        return resSuccess({
            data: noPagination ? { result: totalItems } : { pagination, result: invoiceList }
        });

    } catch (error) {
        throw error;
    }
}