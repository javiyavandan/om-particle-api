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
import { resNotFound, prepareMessageFromParams, getLocalDate, resSuccess, resBadRequest, getInitialPaginationFromQuery, refreshMaterializedDiamondListView, getCurrencyPrice } from "../../utils/shared-functions";
import Master from "../../model/masters.model";
import { Sequelize, Op, QueryTypes } from "sequelize";
import Memo from "../../model/memo.model";
import MemoDetail from "../../model/memo-detail.model";
import { ADMIN_MAIL } from "../../config/env.var";
import { mailAdminInvoice, mailCustomerInvoice } from "../mail.service";

export const createInvoice = async (req: Request) => {
    try {
        const { company_id, customer_id, stock_list, memo_id, remarks } = req.body
        const stockError = [];
        const stockList: any = [];
        let totalItemPrice = 0
        let totalTaxPrice = 0
        let totalWeight = 0
        let taxData = [];

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

        const allStock = await dbContext.query(
            `SELECT * FROM diamond_list WHERE status != '${StockStatus.SOLD}' ${req.body.session_res.company_id ? `and company_id = ${req.body.session_res.company_id}` : ""}`, { type: QueryTypes.SELECT }
        )

        for (let index = 0; index < stock_list.length; index++) {
            const stockId = stock_list[index].stock_id;
            const findStock: any = allStock.find((stock: any) => stock.stock_id === stockId)
            if (!(findStock && findStock)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else {
                totalItemPrice += (stock_list[index].rate * findStock.weight * findStock.quantity),
                    totalWeight += (findStock.weight * findStock.quantity),
                    stockList.push({
                        stock_id: findStock.id,
                        stock_price: stock_list[index].rate,
                    })
            }
        }

        if (taxFind.length > 0) {
            let totalTax = 0;
            for (let index = 0; index < taxFind.length; index++) {
                totalTax += Number(taxFind[index].dataValues.value);
                taxData.push({
                    id: taxFind[index].dataValues.id,
                    value: taxFind[index].dataValues.value,
                    name: taxFind[index].dataValues.name,
                    tax: (totalItemPrice * Number(taxFind[index].dataValues.value)) / 100
                })
            }
            totalTaxPrice = (totalItemPrice * totalTax) / 100;
        }

        if (stockError.length > 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]]),
                data: stockError.map(err => err)
            })
        }

        const trn = await dbContext.transaction();

        const lastInvoice = await Invoice.findOne({
            order: [["invoice_number", "DESC"]],
            transaction: trn,
            attributes: [
                "invoice_number"
            ]
        })

        const invoiceNumber = isNaN(Number(lastInvoice?.dataValues.invoice_number)) ? 1 : Number(lastInvoice?.dataValues.invoice_number) + 1;
        try {
            const invoicePayload = {
                invoice_number: invoiceNumber,
                company_id: findCompany.dataValues.id,
                customer_id: findCustomer.dataValues.id,
                created_at: getLocalDate(),
                created_by: req.body.session_res.id,
                total_item_price: totalItemPrice,
                total_tax_price: totalTaxPrice,
                total_weight: totalWeight,
                total_price: totalItemPrice + totalTaxPrice,
                total_diamond_count: stockList.length,
                tax_data: taxData,
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

            const stockUpdate: any = allStock.filter((stock: any) => stockList.map((data: any) => data.stock_id).includes(stock.id)).map(stock => ({
                ...stock,
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
                        is_return: DeleteStatus.No
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

            const admin = await AppUser.findOne({
                where: {
                    id_role: req.body.session_res.id_role,
                    id: req.body.session_res.id,
                    is_deleted: DeleteStatus.No,
                    is_active: ActiveStatus.Active
                },
                attributes: ["first_name", "last_name", "email", "phone_number"],
                transaction: trn,
            })

            const adminMail = {
                toEmailAddress: req.body.session_res.id_role == 0 ? ADMIN_MAIL : admin?.dataValues.email,
                contentTobeReplaced: {
                    admin_name: admin?.dataValues.first_name,
                    customer_name: findCustomer.dataValues.user.dataValues.first_name + " " + findCustomer.dataValues.user.dataValues.last_name,
                    customer_email: findCustomer.dataValues.user.dataValues.email,
                    customer_company: findCustomer.dataValues.company_name,
                    customer_contact: findCustomer.dataValues.user.dataValues.phone_number,
                    invoice_number: invoiceData.dataValues.invoice_number,
                    total: invoiceData.dataValues.total_item_price,
                    total_weight: invoiceData.dataValues.total_weight,
                    total_diamond: invoiceData.dataValues.total_diamond_count,
                    total_tax: invoiceData.dataValues.total_tax_price,
                    created_at: new Date(invoiceData.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    data: stockUpdate.map((diamond: any) => ({
                        shape: diamond.shape_name,
                        weight: diamond.weight,
                        color: diamond.color_name,
                        clarity: diamond.clarity_name,
                        rate: stockListWithInvoiceId.find((stock: { stock_id: any; }) => stock.stock_id === diamond.id)?.stock_price,
                        stock_id: diamond.stock_id,
                        product_image: diamond.image,
                    }))
                },
            }

            const customerMail = {
                toEmailAddress: findCustomer?.dataValues.user.dataValues.email,
                contentTobeReplaced: {
                    admin_email: admin?.dataValues.email,
                    admin_contact: admin?.dataValues.phone_number,
                    customer_name: findCustomer.dataValues.user.dataValues.first_name + " " + findCustomer.dataValues.user.dataValues.last_name,
                    invoice_number: invoiceData.dataValues.invoice_number,
                    total: invoiceData.dataValues.total_item_price,
                    total_weight: invoiceData.dataValues.total_weight,
                    total_diamond: invoiceData.dataValues.total_diamond_count,
                    total_tax: invoiceData.dataValues.total_tax_price,
                    created_at: new Date(invoiceData.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    data: stockUpdate.map((diamond: any) => ({
                        shape: diamond.shape_name,
                        weight: diamond.weight,
                        color: diamond.color_name,
                        clarity: diamond.clarity_name,
                        rate: stockListWithInvoiceId.find((stock: { stock_id: any; }) => stock.stock_id === diamond.id)?.stock_price,
                        stock_id: diamond.stock_id,
                        product_image: diamond.image,
                    }))
                },
            }

            await mailAdminInvoice(adminMail);
            await mailCustomerInvoice(customerMail);

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
        const currency = await getCurrencyPrice(query.currency as string);
        const shapes = query.shape ? (query.shape as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const colors = query.color ? (query.color as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const color_intensity = query.color_intensity ? (query.color_intensity as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const clarity = query.clarity ? (query.clarity as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const polish = query.polish ? (query.polish as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const symmetry = query.symmetry ? (query.symmetry as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const labs = query.lab ? (query.lab as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const customer = query.customer ? (query.customer as string).split(",").map(id => `${id.trim()}`).join(",") : "";
        const fluorescence = query.fluorescence ? (query.fluorescence as string).split(",").map(id => `${id.trim()}`).join(",") : "";

        const totalItems = await dbContext.query(`
            SELECT *, total_item_price * ${currency} as total_item_price,
            total_tax_price * ${currency} as total_tax_price,
            total_price * ${currency} as total_price,
       (
           SELECT jsonb_agg(
                      jsonb_set(
                          elem,
                          '{stock_price}',
                          to_jsonb((elem->>'stock_price')::double precision * 1)
                      )
                  )
           FROM jsonb_array_elements(invoice_details::jsonb) AS elem
       ) AS invoice_details,
       (
           SELECT jsonb_agg(
                      jsonb_set(
                          tax_elem,
                          '{tax}',
                          to_jsonb((tax_elem->>'tax')::double precision * 1)
                      )
                  )
           FROM jsonb_array_elements(tax_data::jsonb) AS tax_elem
       ) AS tax_data
            FROM invoice_list
            WHERE 
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE 
                CAST(invoice_list.invoice_number AS text) ILIKE '%${pagination.search_text}%'
                OR invoice_list.company_name ILIKE '%${pagination.search_text}%'
                OR invoice_list.state ILIKE '%${pagination.search_text}%'
                OR invoice_list.remarks ILIKE '%${pagination.search_text}%'
                OR invoice_list.country ILIKE '%${pagination.search_text}%'
                OR invoice_list.city ILIKE '%${pagination.search_text}%'
                OR invoice_list.customer_name ILIKE '%${pagination.search_text}%'
                OR invoice_list.last_name ILIKE '%${pagination.search_text}%'
                OR invoice_list.first_name ILIKE '%${pagination.search_text}%'
                OR invoice_list.registration_number ILIKE '%${pagination.search_text}%'
                OR invoice_list.email ILIKE '%${pagination.search_text}%'
                OR invoice_list.phone_number ILIKE '%${pagination.search_text}%'
                OR CAST(invoice_list.total_price AS text) ILIKE '%${pagination.search_text}%'
                OR CAST(invoice_list.total_weight as text) ILIKE '%${pagination.search_text}%'
            END
            ${customer ? `AND invoice_list.customer_id IN (${customer})` : ""}
            ${req.body.session_res.id_role != 0 ? `AND invoice_list.company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND invoice_list.company_id = ${query.company}` : ""}`}
            ${labs ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'lab_id')::integer IN (${labs})
            )` : ''}
            ${colors ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'color_id')::integer IN (${colors})
            )` : ''}
            ${clarity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'clarity_id')::integer IN (${clarity})
            )` : ''}
            ${color_intensity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'color_intensity_id')::integer IN (${color_intensity})
            )` : ''}
            ${fluorescence ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'fluorescence_id')::integer IN (${fluorescence})
            )` : ''}
            ${polish ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'polish_id')::integer IN (${polish})
            )` : ''}
            ${symmetry ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'symmetry_id')::integer IN (${symmetry})
            )` : ''}
            ${shapes ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'shape_id')::integer IN (${shapes})
            )` : ''}
            ${query.start_date && query.end_date
                ? `AND invoice_list.created_at BETWEEN '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
                : ""}
              ${query.start_date && !query.end_date
                ? `AND invoice_list.created_at >= '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0)).toISOString()}'`
                : ""}
              ${!query.start_date && query.end_date
                ? `AND invoice_list.created_at <= '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
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
            SELECT *, total_item_price * ${currency} as total_item_price,
            total_tax_price * ${currency} as total_tax_price,
            total_price * ${currency} as total_price,
       (
           SELECT jsonb_agg(
                      jsonb_set(
                          elem,
                          '{stock_price}',
                          to_jsonb((elem->>'stock_price')::double precision * 1)
                      )
                  )
           FROM jsonb_array_elements(invoice_details::jsonb) AS elem
       ) AS invoice_details,
       (
           SELECT jsonb_agg(
                      jsonb_set(
                          tax_elem,
                          '{tax}',
                          to_jsonb((tax_elem->>'tax')::double precision * 1)
                      )
                  )
           FROM jsonb_array_elements(tax_data::jsonb) AS tax_elem
       ) AS tax_data
        FROM invoice_list
            WHERE 
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE 
                CAST(invoice_list.invoice_number AS text) ILIKE '%${pagination.search_text}%'
                OR invoice_list.company_name ILIKE '%${pagination.search_text}%'
                OR invoice_list.state ILIKE '%${pagination.search_text}%'
                OR invoice_list.remarks ILIKE '%${pagination.search_text}%'
                OR invoice_list.country ILIKE '%${pagination.search_text}%'
                OR invoice_list.city ILIKE '%${pagination.search_text}%'
                OR invoice_list.customer_name ILIKE '%${pagination.search_text}%'
                OR invoice_list.last_name ILIKE '%${pagination.search_text}%'
                OR invoice_list.first_name ILIKE '%${pagination.search_text}%'
                OR invoice_list.registration_number ILIKE '%${pagination.search_text}%'
                OR invoice_list.email ILIKE '%${pagination.search_text}%'
                OR invoice_list.phone_number ILIKE '%${pagination.search_text}%'
                OR CAST(invoice_list.total_price AS text) ILIKE '%${pagination.search_text}%'
                OR CAST(invoice_list.total_weight as text) ILIKE '%${pagination.search_text}%'
            END
            ${customer ? `AND invoice_list.customer_id IN (${customer})` : ""}
            ${req.body.session_res.id_role != 0 ? `AND invoice_list.company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND invoice_list.company_id = ${query.company}` : ""}`}
            ${labs ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'lab_id')::integer IN (${labs})
            )` : ''}
            ${colors ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'color_id')::integer IN (${colors})
            )` : ''}
            ${clarity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'clarity_id')::integer IN (${clarity})
            )` : ''}
            ${color_intensity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'color_intensity_id')::integer IN (${color_intensity})
            )` : ''}
            ${fluorescence ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'fluorescence_id')::integer IN (${fluorescence})
            )` : ''}
            ${polish ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'polish_id')::integer IN (${polish})
            )` : ''}
            ${symmetry ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'symmetry_id')::integer IN (${symmetry})
            )` : ''}
            ${shapes ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(invoice_list.invoice_details) AS detail
                WHERE (detail->>'shape_id')::integer IN (${shapes})
            )` : ''}
            ${query.start_date && query.end_date
                ? `AND invoice_list.created_at BETWEEN '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
                : ""}
              ${query.start_date && !query.end_date
                ? `AND invoice_list.created_at >= '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0)).toISOString()}'`
                : ""}
              ${!query.start_date && query.end_date
                ? `AND invoice_list.created_at <= '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
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