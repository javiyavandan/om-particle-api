import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { ActiveStatus, DeleteStatus, Master_type, MEMO_STATUS, StockStatus, UserVerification } from "../../utils/app-enumeration";
import { getCurrencyPrice, getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, refreshMaterializedDiamondListView, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
import { CUSTOMER_NOT_VERIFIED, ERROR_NOT_FOUND } from "../../utils/app-messages";
import dbContext from "../../config/dbContext";
import Company from "../../model/companys.model";
import Memo from "../../model/memo.model";
import MemoDetail from "../../model/memo-detail.model";
import { Op, QueryTypes, Sequelize } from "sequelize";
import Customer from "../../model/customer.modal";
import AppUser from "../../model/app_user.model";
import Master from "../../model/masters.model";
import { mailAdminMemo, mailCustomerMemo } from "../mail.service";
import { ADMIN_MAIL, IMAGE_PATH } from "../../config/env.var";

export const createMemo = async (req: Request) => {
    try {
        const { company_id, customer_id, stock_list, remarks, contact, salesperson, ship_via, report_date } = req.body
        const stockError = [];
        const stockList: any = [];

        const inputDate = new Date(report_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!isNaN(inputDate.getTime()) && inputDate <= today) {
            return resBadRequest({ message: "Report Date must be a future date" });
        }

        if (stock_list.length == 0) {
            return resBadRequest({
                message: "Please select stock"
            })
        }

        if (req.body.session_res.company_id === undefined && company_id === undefined) {
            return resBadRequest({
                message: "Please select company"
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

        let totalItemPrice = 0;
        let totalWeight = 0;

        for (let index = 0; index < stock_list.length; index++) {
            const stockId = stock_list[index].stock_id;
            const findStock: any = allStock.find((stock: any) => stock.stock_id === stockId)
            if (!(findStock && findStock)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else {

                totalItemPrice += (stock_list[index].rate * findStock.weight * findStock.quantity);
                totalWeight += (findStock.weight * findStock.quantity);

                stockList.push({
                    stock_id: findStock.id,
                    stock_original_price: findStock.rate,
                    stock_price: stock_list[index].rate,
                    created_at: getLocalDate(),
                    created_by: req.body.session_res.id,
                    is_deleted: DeleteStatus.No,
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

        const lastMemo = await Memo.findOne({
            order: [["memo_number", "DESC"]],
            transaction: trn,
            attributes: [
                "memo_number"
            ]
        })

        try {
            const memoPayload = {
                memo_number: isNaN(Number(lastMemo?.dataValues.memo_number)) ? 1 : Number(lastMemo?.dataValues.memo_number) + 1,
                company_id: findCompany.dataValues.id,
                customer_id: findCustomer.dataValues.id,
                status: MEMO_STATUS.Active,
                is_deleted: DeleteStatus.No,
                created_at: getLocalDate(),
                created_by: req.body.session_res.id,
                total_item_price: totalItemPrice,
                total_weight: totalWeight,
                total_diamond_count: stockList.length,
                remarks,
                contact,
                salesperson,
                ship_via,
                report_date: report_date ? new Date(report_date) : null
            };

            const memoData = await Memo.create(memoPayload, {
                transaction: trn,
            });

            const memoId = memoData.dataValues.id;

            const stockListWithMemoId = stockList.map((stock: any) => ({
                ...stock,
                memo_id: memoId,
            }));

            await MemoDetail.bulkCreate(stockListWithMemoId, {
                transaction: trn,
            })

            const stockUpdate: any = allStock.filter((stock: any) => stockList.map((data: any) => data.stock_id).includes(stock.id)).map(stock => ({
                ...stock,
                status: StockStatus.MEMO
            }))

            await Diamonds.bulkCreate(stockUpdate, {
                updateOnDuplicate: [
                    "status"
                ],
                transaction: trn,
            })

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
                    memo_number: memoData.dataValues.memo_number,
                    total: Number(memoData.dataValues.total_item_price).toFixed(2),
                    total_weight: Number(memoData.dataValues.total_weight).toFixed(2),
                    total_diamond: memoData.dataValues.total_diamond_count,
                    created_at: new Date(memoData.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    data: stockUpdate.map((diamond: any) => ({
                        shape: diamond.shape_name,
                        weight: diamond.weight,
                        color: diamond.color_name,
                        clarity: diamond.clarity_name,
                        rate: stockListWithMemoId.find((stock: { stock_id: any; }) => stock.stock_id === diamond.id)?.stock_price,
                        stock_id: diamond.stock_id,
                        product_image: diamond.image,
                    }))
                },
                attachments: {
                    filename: `${memoData.dataValues.memo_number}-MEMO.pdf`,
                    content: "../../../templates/mail-template/india-memo.html",
                    toBeReplace: {
                        admin_contact: admin?.dataValues.phone_number,
                        memo_number: memoData.dataValues.memo_number,
                        total: Number(memoData.dataValues.total_item_price).toFixed(2),
                        total_weight: Number(memoData.dataValues.total_weight).toFixed(2),
                        total_diamond: memoData.dataValues.total_diamond_count,
                        created_at: new Date(memoData.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                        company_address: findCompany.dataValues.company_address + ' ' + findCompany.dataValues.city + ' ' + findCompany.dataValues.state + ' ' + findCompany.dataValues.pincode,
                        company_name: findCompany.dataValues.name,
                        company_contact: findCompany.dataValues.phone_number,
                        logo_image: IMAGE_PATH,
                        data: stockUpdate.map((diamond: any, index: number) => ({
                            index: index + 1,
                            weight: diamond.weight,
                            rate: stockListWithMemoId.find((stock: { stock_id: any; }) => stock.stock_id === diamond.id)?.stock_price,
                            stock_id: diamond.stock_id,
                            quantity: diamond.quantity,
                        })),
                    }
                }
            }

            const customerMail = {
                toEmailAddress: findCustomer?.dataValues.user.dataValues.email,
                contentTobeReplaced: {
                    admin_email: admin?.dataValues.email,
                    admin_contact: admin?.dataValues.phone_number,
                    customer_name: findCustomer.dataValues.user.dataValues.first_name + " " + findCustomer.dataValues.user.dataValues.last_name,
                    memo_number: memoData.dataValues.memo_number,
                    total: memoData.dataValues.total_item_price,
                    total_weight: memoData.dataValues.total_weight,
                    total_diamond: memoData.dataValues.total_diamond_count,
                    created_at: new Date(memoData.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    data: stockUpdate.map((diamond: any) => ({
                        shape: diamond.shape_name,
                        weight: diamond.weight,
                        color: diamond.color_name,
                        clarity: diamond.clarity_name,
                        rate: stockListWithMemoId.find((stock: { stock_id: any; }) => stock.stock_id === diamond.id)?.stock_price,
                        stock_id: diamond.stock_id,
                        product_image: diamond.image,
                    }))
                },
                attachments: {
                    filename: `${memoData.dataValues.memo_number}-MEMO.pdf`,
                    content: "../../../templates/mail-template/india-memo.html",
                    toBeReplace: {
                        admin_contact: admin?.dataValues.phone_number,
                        memo_number: memoData.dataValues.memo_number,
                        total: memoData.dataValues.total_item_price,
                        total_weight: memoData.dataValues.total_weight,
                        total_diamond: memoData.dataValues.total_diamond_count,
                        created_at: new Date(memoData.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                        company_address: findCompany.dataValues.company_address + ' ' + findCompany.dataValues.city + ' ' + findCompany.dataValues.state + ' ' + findCompany.dataValues.pincode,
                        company_name: findCompany.dataValues.name,
                        company_contact: findCompany.dataValues.phone_number,
                        logo_image: IMAGE_PATH,
                        data: stockUpdate.map((diamond: any, index: number) => ({
                            index: index + 1,
                            weight: diamond.weight,
                            rate: stockListWithMemoId.find((stock: { stock_id: any; }) => stock.stock_id === diamond.id)?.stock_price,
                            stock_id: diamond.stock_id,
                            quantity: diamond.quantity,
                        })),
                    }
                }
            }

            console.log(adminMail, customerMail);

            await mailAdminMemo(adminMail);
            await mailCustomerMemo(customerMail);

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

export const getMemo = async (req: Request) => {
    try {
        const { memo_id } = req.params

        const memo = await dbContext.query(
            `SELECT * FROM memo_list WHERE id = ${memo_id}`, { type: QueryTypes.SELECT }
        )

        return resSuccess({
            data: memo[0]
        })

    } catch (error) {
        throw error
    }
}

export const getAllMemo = async (req: Request) => {
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
            SELECT *, total_item_price * ${currency} as total_item_price FROM memo_list
            WHERE 
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE 
                CAST(memo_list.memo_number AS text) ILIKE '%${pagination.search_text}%'
                OR memo_list.company_name ILIKE '%${pagination.search_text}%'
                OR memo_list.state ILIKE '%${pagination.search_text}%'
                OR memo_list.remarks ILIKE '%${pagination.search_text}%'
                OR memo_list.country ILIKE '%${pagination.search_text}%'
                OR memo_list.city ILIKE '%${pagination.search_text}%'
                OR memo_list.customer_name ILIKE '%${pagination.search_text}%'
                OR memo_list.last_name ILIKE '%${pagination.search_text}%'
                OR memo_list.first_name ILIKE '%${pagination.search_text}%'
                OR memo_list.email ILIKE '%${pagination.search_text}%'
                OR memo_list.phone_number ILIKE '%${pagination.search_text}%'
                OR CAST(memo_list.total_item_price as text) ILIKE '%${pagination.search_text}%'
                OR CAST(memo_list.total_weight as text) ILIKE '%${pagination.search_text}%'
            END
            ${customer ? `AND memo_list.customer_id IN (${customer})` : ""}
            ${req.body.session_res.id_role != 0 ? `AND memo_list.company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND memo_list.company_id = ${query.company}` : ""}`}
            ${query.status ? `AND memo_list.status = '${query.status}'` : ''}
            ${labs ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'lab_id')::integer IN (${labs})
            )` : ''}
            ${colors ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'color_id')::integer IN (${colors})
            )` : ''}
            ${clarity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'clarity_id')::integer IN (${clarity})
            )` : ''}
            ${color_intensity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'color_intensity_id')::integer IN (${color_intensity})
            )` : ''}
            ${fluorescence ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'fluorescence_id')::integer IN (${fluorescence})
            )` : ''}
            ${polish ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'polish_id')::integer IN (${polish})
            )` : ''}
            ${symmetry ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'symmetry_id')::integer IN (${symmetry})
            )` : ''}
            ${shapes ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'shape_id')::integer IN (${shapes})
            )` : ''}
            ${query.start_date && query.end_date
                ? `AND memo_list.created_at BETWEEN '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
                : ""}
              ${query.start_date && !query.end_date
                ? `AND memo_list.created_at >= '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0)).toISOString()}'`
                : ""}
              ${!query.start_date && query.end_date
                ? `AND memo_list.created_at <= '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
                : ""}
                ${query.min_rate && query.max_rate ? `AND memo_list.total_price BETWEEN ${query.min_rate} AND ${query.max_rate}` : ""}
                ${query.min_rate && !query.max_rate ? `AND memo_list.total_price >= ${query.min_rate}` : ""}
                ${!query.min_rate && query.max_rate ? `AND memo_list.total_price <= ${query.max_rate}` : ""}
                ${query.min_weight && query.max_weight ? `AND memo_list.total_weight BETWEEN ${query.min_weight} AND ${query.max_weight}` : ""}
                ${query.min_weight && !query.max_weight ? `AND memo_list.total_weight >= ${query.min_weight}` : ""}
                ${!query.min_weight && query.max_weight ? `AND memo_list.total_weight <= ${query.max_weight}` : ""}
                ORDER BY id ASC
        `, { type: QueryTypes.SELECT });

        if (!noPagination) {
            if (totalItems.length === 0) {
                return resSuccess({ data: { pagination, result: [] } });
            }

            pagination.total_items = totalItems.length;
            pagination.total_pages = Math.ceil(totalItems.length / pagination.per_page_rows);
        }

        const memoList = await dbContext.query(`
            SELECT *, total_item_price * ${currency} as total_item_price FROM memo_list
            WHERE 
                CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE 
                CAST(memo_list.memo_number AS text) ILIKE '%${pagination.search_text}%'
                OR memo_list.company_name ILIKE '%${pagination.search_text}%'
                OR memo_list.state ILIKE '%${pagination.search_text}%'
                OR memo_list.remarks ILIKE '%${pagination.search_text}%'
                OR memo_list.country ILIKE '%${pagination.search_text}%'
                OR memo_list.city ILIKE '%${pagination.search_text}%'
                OR memo_list.customer_name ILIKE '%${pagination.search_text}%'
                OR memo_list.last_name ILIKE '%${pagination.search_text}%'
                OR memo_list.first_name ILIKE '%${pagination.search_text}%'
                OR memo_list.email ILIKE '%${pagination.search_text}%'
                OR memo_list.phone_number ILIKE '%${pagination.search_text}%'
                OR CAST(memo_list.total_item_price as text) ILIKE '%${pagination.search_text}%'
                OR CAST(memo_list.total_weight as text) ILIKE '%${pagination.search_text}%'
            END
            ${customer ? `AND memo_list.customer_id IN (${customer})` : ""}
            ${req.body.session_res.id_role != 0 ? `AND memo_list.company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND memo_list.company_id = ${query.company}` : ""}`}
            ${query.status ? `AND memo_list.status = '${query.status}'` : ''}
            ${labs ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'lab_id')::integer IN (${labs})
            )` : ''}
            ${colors ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'color_id')::integer IN (${colors})
            )` : ''}
            ${clarity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'clarity_id')::integer IN (${clarity})
            )` : ''}
            ${color_intensity ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'color_intensity_id')::integer IN (${color_intensity})
            )` : ''}
            ${fluorescence ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'fluorescence_id')::integer IN (${fluorescence})
            )` : ''}
            ${polish ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'polish_id')::integer IN (${polish})
            )` : ''}
            ${symmetry ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'symmetry_id')::integer IN (${symmetry})
            )` : ''}
            ${shapes ? `AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(memo_list.memo_details) AS detail
                WHERE (detail->>'shape_id')::integer IN (${shapes})
            )` : ''}
            ${query.start_date && query.end_date
                ? `AND memo_list.created_at BETWEEN '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
                : ""}
              ${query.start_date && !query.end_date
                ? `AND memo_list.created_at >= '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0)).toISOString()}'`
                : ""}
              ${!query.start_date && query.end_date
                ? `AND memo_list.created_at <= '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
                : ""}
                ${query.min_rate && query.max_rate ? `AND memo_list.total_price BETWEEN ${query.min_rate} AND ${query.max_rate}` : ""}
                ${query.min_rate && !query.max_rate ? `AND memo_list.total_price >= ${query.min_rate}` : ""}
                ${!query.min_rate && query.max_rate ? `AND memo_list.total_price <= ${query.max_rate}` : ""}
                ${query.min_weight && query.max_weight ? `AND memo_list.total_weight BETWEEN ${query.min_weight} AND ${query.max_weight}` : ""}
                ${query.min_weight && !query.max_weight ? `AND memo_list.total_weight >= ${query.min_weight}` : ""}
                ${!query.min_weight && query.max_weight ? `AND memo_list.total_weight <= ${query.max_weight}` : ""}
                ORDER BY ${pagination.sort_by} ${pagination.order_by}
                OFFSET
                  ${(pagination.current_page - 1) * pagination.per_page_rows} ROWS
                  FETCH NEXT ${pagination.per_page_rows} ROWS ONLY
        `, { type: QueryTypes.SELECT });

        return resSuccess({
            data: noPagination ? { result: totalItems } : { pagination, result: memoList }
        });

    } catch (error) {
        throw error;
    }
}

export const returnMemoStock = async (req: Request) => {
    try {
        const { memo_id, stock_list, company_id } = req.body;
        const stockError = [];
        const stockList = [];
        const memoDetailStock = [];

        if (stock_list) {
            if (stock_list.length == 0) {
                return resBadRequest({
                    message: "Please select stock"
                })
            }
        }

        const memo = await Memo.findOne({
            where: {
                id: memo_id,
                is_deleted: DeleteStatus.No
            },
            include: [
                {
                    model: MemoDetail,
                    as: 'memo_details',
                }
            ]
        })

        if (!(memo && memo.dataValues)) {
            return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Memo"]]) })
        }

        if (stock_list) {
            for (let index = 0; index < stock_list.length; index++) {
                const element = stock_list[index];
                if (!memo.dataValues.memo_details.map((data: any) => data.dataValues.stock_id).includes(`${element}`)) {
                    return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${element} stock`]]) })
                }
            }
        }

        const stockData = stock_list && stock_list.length > 0 ? stock_list : memo.dataValues.memo_details.filter((memoData: any) => memoData.dataValues.is_return === ActiveStatus.InActive && memoData.dataValues.memo_id === memo_id).map((data: any) => data.dataValues.stock_id)

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                company_id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
                status: StockStatus.MEMO
            }
        })

        for (let index = 0; index < stockData.length; index++) {
            const stockId = stockData[index];
            const findStock = allStock.find(stock => stock.dataValues.id == stockId)
            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else {
                stockList.push({
                    ...findStock.dataValues,
                    modified_at: getLocalDate(),
                    modified_by: req.body.session_res.id,
                    status: StockStatus.AVAILABLE,
                })
                const memoDetail = memo.dataValues.memo_details.find((data: any) => data.dataValues.stock_id == stockId)
                memoDetailStock.push({
                    ...memoDetail.dataValues,
                    is_return: ActiveStatus.Active,
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
        try {
            await Diamonds.bulkCreate(stockList, {
                updateOnDuplicate: ["modified_at", "modified_by", "status"],
                transaction: trn
            });

            await MemoDetail.bulkCreate(memoDetailStock, {
                updateOnDuplicate: ["is_return"],
                transaction: trn
            })

            const memoDetail = await MemoDetail.findAll({
                where: {
                    memo_id: memo.dataValues.id,
                    is_deleted: DeleteStatus.No,
                    is_return: ActiveStatus.InActive,
                },
                include: [
                    {
                        model: Diamonds,
                        as: 'stocks',
                        attributes: ["status"],
                        where: {
                            status: StockStatus.MEMO
                        }
                    }
                ],
                transaction: trn
            })

            if (memoDetail.length === 0) {
                await Memo.update({
                    status: MEMO_STATUS.Close,
                }, {
                    where: {
                        id: memo.dataValues.id
                    },
                    transaction: trn
                })
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