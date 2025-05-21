import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { ActiveStatus, DeleteStatus, Discount_Type, Master_type, Memo_Invoice_Type, MEMO_STATUS, Memo_Invoice_creation, StockStatus, UserVerification, Log_Type } from "../../utils/app-enumeration";
import { getCurrencyPrice, getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, refreshMaterializedDiamondListView, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
import { CUSTOMER_NOT_VERIFIED, ERROR_NOT_FOUND, PACKET_MEMO_CREATE_WITH_DIFFERENT_MEMO_TYPE_ERROR } from "../../utils/app-messages";
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
import PacketDiamonds from "../../model/packet-diamond.model";
import Invoice from "../../model/invoice.model";
import InvoiceDetail from "../../model/invoice-detail.model";
import StockLogs from "../../model/stock-logs.model";

export const createMemo = async (req: Request) => {
    try {
        const data = await memoCreation(req.body)
        return data;
    } catch (error) {
        throw error
    }
}

export const memoCreation = async (data: any) => {
    try {
        const { company_id, customer_id, stock_list, memo_creation_type, remarks, contact, salesperson, ship_via, report_date, cust_order, tracking, shipping_charge = 0, discount = 0, discount_type = Discount_Type.Amount, session_res } = data
        const stockError = [];
        const stockList: any = [];

        if (!Object.values(Memo_Invoice_creation).includes(memo_creation_type)) {
            return resBadRequest({ message: "Invalid menu type" })
        }

        if (report_date) {
            const inputDate = new Date(report_date);

            if (isNaN(inputDate.getTime())) {
                return resBadRequest({ message: "Invalid date format" });
            }

            const inputUTC = Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

            const today = new Date();
            const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

            if (inputUTC < todayUTC) {
                return resBadRequest({ message: "Report date must be a future date" });
            }
        }

        if (stock_list.length == 0) {
            return resBadRequest({
                message: "Please select stock"
            })
        }

        if (session_res.company_id === undefined && company_id === undefined) {
            return resBadRequest({
                message: "Please select company"
            })
        }

        const findCompany = await Company.findOne({
            where: {
                id: session_res.company_id ? session_res.company_id : company_id,
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

        let allStock;

        if (memo_creation_type === Memo_Invoice_creation.Single) {
            allStock = await Diamonds.findAll({
                where: {
                    status: StockStatus.AVAILABLE,
                    company_id: session_res.company_id ? session_res.company_id : company_id
                },
                attributes: [
                    "id",
                    "stock_id",
                    "status",
                    "is_active",
                    "is_deleted",
                    "shape",
                    "quantity",
                    "remain_quantity",
                    "weight",
                    "rate",
                    "color",
                    "color_intensity",
                    "color_over_tone",
                    "clarity",
                    "lab",
                    "report",
                    "polish",
                    "symmetry",
                    "video",
                    "image",
                    "certificate",
                    "local_location",
                    "measurement_height",
                    "measurement_width",
                    "measurement_depth",
                    "table_value",
                    "depth_value",
                    "ratio",
                    "fluorescence",
                    "company_id",
                    "user_comments",
                    "admin_comments",
                    "loose_diamond",
                    "created_by",
                    "created_at",
                    "modified_by",
                    "modified_at",
                    "deleted_by",
                    "deleted_at",
                    [Sequelize.literal(`"shape_master"."name"`), 'shape_name'],
                    [Sequelize.literal(`"color_master"."name"`), 'color_name'],
                    [Sequelize.literal(`"clarity_master"."name"`), 'clarity_name']
                ],
                include: [
                    {
                        model: Master,
                        as: 'shape_master',
                        attributes: []
                    },
                    {
                        model: Master,
                        as: 'color_master',
                        attributes: []
                    },
                    {
                        model: Master,
                        as: 'clarity_master',
                        attributes: []
                    }
                ]
            })
        } else {
            allStock = await PacketDiamonds.findAll({
                where: {
                    status: StockStatus.AVAILABLE,
                    company_id: session_res.company_id ? session_res.company_id : company_id
                },
                attributes: [
                    "id",
                    ["packet_id", "stock_id"],
                    "status",
                    "is_active",
                    "is_deleted",
                    "shape",
                    "quantity",
                    "remain_quantity",
                    "weight",
                    "remain_weight",
                    "carat_rate",
                    "rate",
                    "color",
                    "color_intensity",
                    "color_over_tone",
                    "clarity",
                    "lab",
                    "report",
                    "polish",
                    "symmetry",
                    "video",
                    "image",
                    "certificate",
                    "local_location",
                    "measurement_height",
                    "measurement_width",
                    "measurement_depth",
                    "table_value",
                    "depth_value",
                    "ratio",
                    "fluorescence",
                    "company_id",
                    "user_comments",
                    "admin_comments",
                    "created_by",
                    "created_at",
                    "modified_by",
                    "modified_at",
                    "deleted_by",
                    "deleted_at",
                    [Sequelize.literal(`"shape_master"."name"`), 'shape_name'],
                    [Sequelize.literal(`"color_master"."name"`), 'color_name'],
                    [Sequelize.literal(`"clarity_master"."name"`), 'clarity_name']
                ],
                include: [
                    {
                        model: Master,
                        as: 'shape_master',
                        attributes: []
                    },
                    {
                        model: Master,
                        as: 'color_master',
                        attributes: []
                    },
                    {
                        model: Master,
                        as: 'clarity_master',
                        attributes: []
                    }
                ]
            })
        }

        let totalItemPrice = 0;
        let totalWeight = 0;

        for (let index = 0; index < stock_list.length; index++) {
            const stockId = stock_list[index].stock_id;
            const findStock = allStock.find(stock => stock.dataValues.stock_id == stockId);
            const memo_type = (Number(findStock?.dataValues?.quantity) < 2) ? Memo_Invoice_Type.carat : Memo_Invoice_Type.quantity;
            const quantity = memo_type === Memo_Invoice_Type.carat && memo_creation_type === Memo_Invoice_creation.Single ? findStock?.dataValues?.remain_quantity : stock_list[index].quantity;
            const weight = memo_type === Memo_Invoice_Type.carat && memo_creation_type === Memo_Invoice_creation.Single ? findStock?.dataValues?.weight : stock_list[index].weight;

            if (memo_creation_type === Memo_Invoice_creation.Packet) {

                const findMemoExist = await Memo.count({
                    where: { creation_type: Memo_Invoice_creation.Packet },
                    include: [{ model: MemoDetail, as: "memo_details", attributes: ["id", "stock_id", "memo_type"], where: { memo_type: { [Op.ne]: memo_type }, stock_id: findStock?.dataValues.id } }],
                });

                if (findMemoExist && findMemoExist > 0) {
                    stockError.push(prepareMessageFromParams(PACKET_MEMO_CREATE_WITH_DIFFERENT_MEMO_TYPE_ERROR, [["type", "memo"], ["type_1", "memo"], ["stock_id", `${stock_list[index].stock_id}`], ["memo_type", `${memo_type == Memo_Invoice_Type.quantity ? Memo_Invoice_Type.carat : Memo_Invoice_Type.quantity}`]]))
                }

                const findInvoiceExist = await Invoice.count({
                    where: { creation_type: Memo_Invoice_creation.Packet },
                    include: [{ model: InvoiceDetail, as: "invoice_details", attributes: ["id", "stock_id", "invoice_type"], where: { invoice_type: { [Op.ne]: memo_type }, stock_id: findStock?.dataValues.id } }],
                });

                if (findInvoiceExist && findInvoiceExist > 0) {
                    stockError.push(prepareMessageFromParams(PACKET_MEMO_CREATE_WITH_DIFFERENT_MEMO_TYPE_ERROR, [["type", "invoice"], ["type_1", "memo"], ["stock_id", `${stock_list[index].stock_id}`], ["memo_type", `${memo_type == Memo_Invoice_Type.quantity ? Memo_Invoice_Type.carat : Memo_Invoice_Type.quantity}`]]))
                }

            }

            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else if (!Object.values(Memo_Invoice_Type).includes(memo_type)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${memo_type} memo type`]]))
            } else {
                if (
                    memo_type === Memo_Invoice_Type.carat
                ) {
                    if (!weight) {
                        stockError.push(`${stockId} stock weight is required`)
                    } else if (weight > findStock.dataValues.remain_weight) {
                        stockError.push(`${stockId} stock weight is greater than available weight`)
                    } else if (weight <= 0) {
                        stockError.push(`${stockId} stock weight should be greater than zero`)
                    } else {
                        totalItemPrice += (stock_list[index].rate * weight);
                        totalWeight += weight;

                        stockList.push({
                            stock: findStock.dataValues.stock_id,
                            stock_id: findStock.dataValues.id,
                            stock_original_price: findStock.dataValues.rate,
                            stock_price: stock_list[index].rate,
                            quantity: quantity ?? findStock.dataValues.quantity,
                            weight,
                            memo_type: Memo_Invoice_Type.carat,
                            created_at: getLocalDate(),
                            created_by: session_res.id,
                            is_deleted: DeleteStatus.No,
                        })
                    }
                } else {
                    if (!quantity) {
                        stockError.push(`${stockId} stock quantity is required`)
                    } else if (quantity > findStock.dataValues.remain_quantity) {
                        stockError.push(`${stockId} stock quantity is greater than available quantity`)
                    } else if (quantity <= 0) {
                        stockError.push(`${stockId} stock quantity should be greater than zero`)
                    } else if (!weight) {
                        stockError.push(`${stockId} stock weight is required`)
                    } else if (weight > findStock.dataValues.remain_weight) {
                        stockError.push(`${stockId} stock weight is greater than available weight`)
                    } else if (weight <= 0) {
                        stockError.push(`${stockId} stock weight should be greater than zero`)
                    } else {
                        totalItemPrice += (stock_list[index].rate * weight);
                        totalWeight += weight;

                        stockList.push({
                            stock: findStock.dataValues.stock_id,
                            stock_id: findStock.dataValues.id,
                            stock_original_price: findStock.dataValues.rate,
                            stock_price: stock_list[index].rate,
                            quantity,
                            weight,
                            memo_type,
                            created_at: getLocalDate(),
                            created_by: session_res.id,
                            is_deleted: DeleteStatus.No,
                        })
                    }
                }

            }
        }

        if (discount) {
            if (totalItemPrice <= discount) {
                return resBadRequest({ message: "Discount amount should be less than total item price" });
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
            where: {
                company_id: session_res.company_id ? session_res.company_id : company_id
            },
            order: [["memo_number", "DESC"]],
            transaction: trn,
            attributes: [
                "memo_number"
            ]
        })

        const shipping_charge_value = Number(shipping_charge)
        const discount_value = Number(discount)

        const totalPrice = (totalItemPrice - discount_value) + Number(shipping_charge)

        try {
            const memoPayload = {
                memo_number: isNaN(Number(lastMemo?.dataValues.memo_number)) ? 1 : Number(lastMemo?.dataValues.memo_number) + 1,
                company_id: findCompany.dataValues.id,
                customer_id: findCustomer.dataValues.id,
                status: MEMO_STATUS.Active,
                is_deleted: DeleteStatus.No,
                created_at: getLocalDate(),
                created_by: session_res.id,
                total_item_price: Number(totalItemPrice.toFixed(2)),
                total_price: Number(totalPrice.toFixed(2)),
                shipping_charge: Number(shipping_charge_value.toFixed(2)),
                discount: Number(discount_value.toFixed(2)),
                discount_type,
                total_weight: Number(totalWeight.toFixed(2)),
                total_diamond_count: stockList.length,
                remarks,
                contact,
                salesperson,
                ship_via,
                cust_order,
                tracking,
                report_date: report_date ? new Date(report_date) : null,
                creation_type: memo_creation_type
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

            let stockUpdate: any
            if (memo_creation_type === Memo_Invoice_creation.Single) {
                stockUpdate = allStock.filter((stock) => stockList.map((data: any) => data.stock_id).includes(stock.dataValues.id)).map(stock => ({
                    ...stock.dataValues,
                    status: StockStatus.MEMO,
                    remain_quantity: stock.dataValues.remain_quantity - stockList.find((data: any) => data.stock_id == stock.dataValues.id).quantity
                }))
                await Diamonds.bulkCreate(stockUpdate, {
                    updateOnDuplicate: [
                        "remain_quantity",
                        "status"
                    ],
                    transaction: trn,
                })
            } else {

                stockUpdate = allStock.filter((stock) => stockList.map((data: any) => data.stock_id).includes(stock.dataValues.id)).map(stock => {
                    const findStock = stockList.find((data: any) => data.stock_id == stock.dataValues.id)

                    return {
                        ...stock.dataValues,
                        packet_id: stock.dataValues.stock_id,
                        remain_quantity: stock.dataValues.remain_quantity - findStock.quantity,
                        remain_weight: stock.dataValues.remain_weight - findStock.weight,
                    }

                })
                await PacketDiamonds.bulkCreate(stockUpdate, {
                    updateOnDuplicate: [
                        "remain_quantity",
                        "remain_weight",
                    ],
                    transaction: trn,
                })
            }
            const admin = await AppUser.findOne({
                where: {
                    id_role: session_res.id_role,
                    id: session_res.id,
                    is_deleted: DeleteStatus.No,
                    is_active: ActiveStatus.Active
                },
                attributes: ["first_name", "last_name", "email", "phone_number", "id"],
                transaction: trn,
            })

            const adminMail = {
                toEmailAddress: session_res.id_role == 0 ? ADMIN_MAIL : admin?.dataValues.email,
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

            await StockLogs.create({
                change_at: getLocalDate(),
                change_by: admin?.dataValues?.first_name + " " + admin?.dataValues?.last_name,
                change_by_id: admin?.dataValues?.id,
                log_type: Log_Type.MEMO,
                reference_id: memoId,
                description: `Created Memo of ${stockList?.map((item: any) => item?.stock)?.join(", ")}`
            }, {
                transaction: trn
            })

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

        const logs = await StockLogs.findAll({
            where: {
                reference_id: memo_id,
                log_type: Log_Type.MEMO,
            }
        })

        return resSuccess({
            data: {
                ...memo[0],
                logs,
            }
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
            ${query.creation_type ? `AND memo_list.creation_type = '${query.creation_type}'` : ''}
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
            ${query.creation_type ? `AND memo_list.creation_type = '${query.creation_type}'` : ''}
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
            data: noPagination ? totalItems : { pagination, result: memoList }
        });

    } catch (error) {
        throw error;
    }
}

export const returnMemoStock = async (req: Request) => {
    try {
        const { memo_id, stock_list, company_id } = req.body;
        const stockError = [];
        const stockList: any = [];
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

        const admin = await AppUser.findOne({
            where: {
                id_role: req.body.session_res.id_role,
                id: req.body.session_res.id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            },
            attributes: ["first_name", "last_name", "id"],
        })

        if (!(memo && memo.dataValues)) {
            return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Memo"]]) })
        }

        const memoType = memo?.dataValues?.creation_type

        if (stock_list) {
            for (let index = 0; index < stock_list.length; index++) {
                const element = stock_list[index];
                if (!memo.dataValues.memo_details.map((data: any) => data.dataValues.stock_id).includes(`${element}`)) {
                    return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${element} stock`]]) })
                }
            }
        }

        const stockData = stock_list && stock_list.length > 0 ? stock_list : memo.dataValues.memo_details.filter((memoData: any) => memoData.dataValues.is_return === ActiveStatus.InActive && memoData.dataValues.memo_id === memo_id).map((data: any) => data.dataValues.stock_id)

        let allStock

        if (memoType === Memo_Invoice_creation.Packet) {
            allStock = await PacketDiamonds.findAll({
                where: {
                    is_deleted: DeleteStatus.No,
                    company_id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
                }
            })
        } else {
            allStock = await Diamonds.findAll({
                where: {
                    is_deleted: DeleteStatus.No,
                    company_id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
                    status: StockStatus.MEMO
                }
            })
        }

        for (let index = 0; index < stockData.length; index++) {
            const stockId = stockData[index];
            const findStock = allStock.find(stock => stock.dataValues.id == stockId)
            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else {
                const memoDetail = memo.dataValues.memo_details.find((data: any) => data.dataValues.stock_id == stockId)
                memoDetailStock.push({
                    ...memoDetail.dataValues,
                    is_return: ActiveStatus.Active,
                })
                if (memoType === Memo_Invoice_creation.Packet) {

                    stockList.push({
                        ...findStock.dataValues,
                        modified_at: getLocalDate(),
                        remain_quantity: Number(findStock.dataValues.remain_quantity) + Number(memoDetail.dataValues.quantity),
                        remain_weight: Number(findStock.dataValues.remain_weight) + Number(memoDetail.dataValues.weight),
                        modified_by: req.body.session_res.id,
                        status: StockStatus.AVAILABLE,
                    })

                } else {
                    stockList.push({
                        ...findStock.dataValues,
                        remain_quantity: findStock.dataValues.remain_quantity + memoDetail.dataValues.quantity,
                        modified_at: getLocalDate(),
                        modified_by: req.body.session_res.id,
                        status: StockStatus.AVAILABLE,
                    })
                }

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

            if (memoType === Memo_Invoice_creation.Packet) {
                await PacketDiamonds.bulkCreate(stockList, {
                    updateOnDuplicate: ["modified_at", "modified_by", "status", 'remain_quantity', 'remain_weight'],
                    transaction: trn
                });
            } else {
                await Diamonds.bulkCreate(stockList, {
                    updateOnDuplicate: ["modified_at", "modified_by", "status", 'remain_quantity'],
                    transaction: trn
                });
            }


            await MemoDetail.bulkCreate(memoDetailStock, {
                updateOnDuplicate: ["is_return"],
                transaction: trn
            })

            if (memoType === Memo_Invoice_creation.Single) {
                const memoDetail = await MemoDetail.findAll({
                    where: {
                        memo_id,
                        is_deleted: DeleteStatus.No,
                        is_return: DeleteStatus.No
                    },
                    transaction: trn,
                })
                const allStock = await Diamonds.findAll({
                    where: {
                        is_deleted: DeleteStatus.No,
                        status: StockStatus.MEMO
                    }
                })
                const memoDetailCheck = memoDetail?.map((item) => {
                    const stock = allStock?.find((s: any) => s.dataValues?.id == item?.dataValues?.stock_id)
                    return {
                        is_deleted: stock?.dataValues?.is_deleted,
                        status: stock?.dataValues?.status
                    }
                })
                if (memoDetailCheck?.length === 0) {
                    await Memo.update({
                        status: MEMO_STATUS.Close,
                    }, {
                        where: {
                            id: memo.dataValues.id
                        },
                        transaction: trn
                    })

                    await StockLogs.create({
                        change_at: getLocalDate(),
                        change_by: admin?.dataValues?.first_name + " " + admin?.dataValues?.last_name,
                        change_by_id: admin?.dataValues?.id,
                        log_type: Log_Type.MEMO,
                        reference_id: memo_id,
                        description: `Memo is closed with ${stockList?.map((item: any) => memoType === Memo_Invoice_creation.Packet ? item?.packet_id : item?.stock_id)?.join(", ")}`
                    }, {
                        transaction: trn
                    })
                } else {
                    await StockLogs.create({
                        change_at: getLocalDate(),
                        change_by: admin?.dataValues?.first_name + " " + admin?.dataValues?.last_name,
                        change_by_id: admin?.dataValues?.id,
                        log_type: Log_Type.MEMO,
                        reference_id: memo_id,
                        description: `Stock ${stockList?.map((item: any) => memoType === Memo_Invoice_creation.Packet ? item?.packet_id : item?.stock_id)?.join(", ")} return from memo`
                    }, {
                        transaction: trn
                    })
                }
            } else {
                let totalMemoWeight = 0;
                let totalMemoItemPrice = 0;

                const memoDetail = await MemoDetail.findAll({
                    where: {
                        memo_id,
                        is_deleted: DeleteStatus.No,
                        is_return: DeleteStatus.No
                    },
                    transaction: trn
                })

                const memoDetailUpdate: any = memoDetail?.map((item) => {
                    const findStock = stockList?.find((stock: any) => stock?.id == item?.dataValues?.stock_id)

                    if (findStock) {
                        const updatedWeight = Number(item?.dataValues?.weight) - Number(findStock?.weight)
                        totalMemoWeight += Number(findStock?.weight);
                        totalMemoItemPrice += updatedWeight * Number(item?.dataValues?.stock_price)
                    } else {
                        totalMemoWeight += Number(item?.dataValues?.weight);
                        totalMemoItemPrice += Number(item?.dataValues?.weight) * Number(item?.dataValues?.stock_price)
                    }

                    return {
                        ...item.dataValues,
                        weight: Number(item?.dataValues?.weight) - Number(findStock?.weight),
                        quantity: Number(item?.dataValues?.quantity) - Number(findStock?.quantity)
                    }
                })

                const totalMemoPrice = ((totalMemoItemPrice - Number(memo?.dataValues?.discount ?? 0)) + Number(memo?.dataValues?.shipping_charge ?? 0))

                const memoStatus = (Number(memo?.dataValues?.total_weight) - totalMemoWeight) === 0 ? MEMO_STATUS.Close : MEMO_STATUS.Active


                await Memo.update({
                    total_item_price: totalMemoItemPrice,
                    total_price: totalMemoPrice,
                    total_weight: Number(memo?.dataValues?.total_weight) - totalMemoWeight,
                    status: memoStatus
                }, {
                    where: {
                        id: memo?.dataValues?.id
                    }, transaction: trn
                })

                await MemoDetail.bulkCreate(memoDetailUpdate, {
                    updateOnDuplicate: [
                        "weight",
                        "quantity"
                    ],
                    transaction: trn
                })

                if (memoStatus === MEMO_STATUS.Close) {
                    await StockLogs.create({
                        change_at: getLocalDate(),
                        change_by: admin?.dataValues?.first_name + " " + admin?.dataValues?.last_name,
                        change_by_id: admin?.dataValues?.id,
                        log_type: Log_Type.MEMO,
                        reference_id: memo_id,
                        description: `Memo is closed with ${stockList?.map((item: any) => memoType === Memo_Invoice_creation.Packet ? item?.packet_id : item?.stock_id)?.join(", ")}`
                    }, {
                        transaction: trn
                    })
                } else {
                    await StockLogs.create({
                        change_at: getLocalDate(),
                        change_by: admin?.dataValues?.first_name + " " + admin?.dataValues?.last_name,
                        change_by_id: admin?.dataValues?.id,
                        log_type: Log_Type.MEMO,
                        reference_id: memo_id,
                        description: `Stock ${stockList?.map((item: any) => memoType === Memo_Invoice_creation.Packet ? item?.packet_id : item?.stock_id)?.join(", ")} return from memo`
                    }, {
                        transaction: trn
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