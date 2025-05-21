import { Request } from "express";
import dbContext from "../../config/dbContext";
import AppUser from "../../model/app_user.model";
import Company from "../../model/companys.model";
import Customer from "../../model/customer.modal";
import Diamonds from "../../model/diamond.model";
import InvoiceDetail from "../../model/invoice-detail.model";
import Invoice from "../../model/invoice.model";
import { DeleteStatus, ActiveStatus, UserVerification, StockStatus, MEMO_STATUS, Master_type, INVOICE_STATUS, Discount_Type, Memo_Invoice_creation, Memo_Invoice_Type, Log_Type } from "../../utils/app-enumeration";
import { ERROR_NOT_FOUND, PACKET_MEMO_CREATE_WITH_DIFFERENT_MEMO_TYPE_ERROR } from "../../utils/app-messages";
import { resNotFound, prepareMessageFromParams, getLocalDate, resSuccess, resBadRequest, getInitialPaginationFromQuery, refreshMaterializedDiamondListView, getCurrencyPrice } from "../../utils/shared-functions";
import Master from "../../model/masters.model";
import { Sequelize, Op, QueryTypes } from "sequelize";
import Memo from "../../model/memo.model";
import MemoDetail from "../../model/memo-detail.model";
import { ADMIN_MAIL } from "../../config/env.var";
import { mailAdminInvoice, mailCustomerInvoice } from "../mail.service";
import PacketDiamonds from "../../model/packet-diamond.model";
import StockLogs from "../../model/stock-logs.model";

export const createInvoice = async (req: Request) => {
    try {
        const data = await invoiceCreation(req.body)

        return data
    } catch (error) {
        throw error
    }
}

export const invoiceCreation = async (data: any) => {
    try {
        const { company_id, customer_id, invoice_creation_type = Memo_Invoice_creation.Single, stock_list, memo_id, remarks, contact, salesperson, ship_via, report_date, cust_order, tracking, shipping_charge = 0, discount = 0, discount_type = Discount_Type.Amount, session_res } = data
        const stockError = [];
        const stockList: any = [];
        let totalItemPrice = 0
        let totalTaxPrice = 0
        let totalWeight = 0
        let taxData = [];

        const shipping_charge_value = Number(shipping_charge)
        const discount_value = Number(discount)

        let findMemo;

        if (memo_id) {
            findMemo = await Memo.findOne({
                where: {
                    id: memo_id,
                    status: MEMO_STATUS.Active,
                }
            })

            if (!(findMemo && findMemo?.dataValues)) {
                return resNotFound({
                    message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Memo"]])
                })
            }
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

        let allStock: any;

        if (invoice_creation_type === Memo_Invoice_creation.Single) {
            allStock = await Diamonds.findAll({
                where: [
                    memo_id ? { status: StockStatus.MEMO } : { status: StockStatus.AVAILABLE },
                    { company_id: session_res.company_id ? session_res.company_id : company_id }
                ],
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

        let memoDetail = null;
        if (memo_id) {
            const detail = await MemoDetail.findAll({
                where: {
                    memo_id,
                    is_deleted: DeleteStatus.No,
                    is_return: DeleteStatus.No
                },
                attributes: ["quantity", "weight", "stock_id"],
            });
            const memoDetailCheck = detail?.map((item) => {
                const stock = allStock?.find((s: any) => s.dataValues?.id == item?.dataValues?.stock_id)
                return {
                    is_deleted: stock?.dataValues?.is_deleted,
                    status: stock?.dataValues?.status
                }
            })
            memoDetail = memoDetailCheck?.filter((item) => item.is_deleted == DeleteStatus.No && item.status == StockStatus.MEMO)
        }

        for (let index = 0; index < stock_list.length; index++) {
            const stockId = stock_list[index].stock_id;
            const findStock = allStock.find((stock: any) => stock.dataValues.stock_id == stockId);
            const invoice_type = (Number(findStock?.dataValues?.quantity) < 2) ? Memo_Invoice_Type.carat : Memo_Invoice_Type.quantity;
            const quantity = invoice_type === Memo_Invoice_Type.carat && invoice_creation_type === Memo_Invoice_creation.Single ? findStock?.dataValues?.remain_quantity : stock_list[index].quantity;
            const weight = invoice_type === Memo_Invoice_Type.carat && invoice_creation_type === Memo_Invoice_creation.Single ? findStock?.dataValues?.weight : stock_list[index].weight;

            if (memo_id) {
                const findMemoStock: any = memoDetail?.find((item: any) => item.dataValues?.stock_id === findStock?.dataValues?.id)
                if (quantity > findMemoStock?.dataValues?.quantity) {
                    stockError.push(`Quantity is grater then memo stock ${stockId}`)
                }
                if (weight > findMemoStock?.dataValues?.weight) {
                    stockError.push(`Weight (carat) is grater then memo stock ${stockId}`)
                }
            }

            if (invoice_creation_type === Memo_Invoice_creation.Packet) {

                const findMemoExist = await Memo.count({
                    where: { creation_type: Memo_Invoice_creation.Packet },
                    include: [{ model: MemoDetail, as: "memo_details", attributes: ["id", "stock_id", "memo_type"], where: { memo_type: { [Op.ne]: invoice_type }, stock_id: findStock?.dataValues.id } }],
                });

                if (findMemoExist && findMemoExist > 0) {
                    stockError.push(prepareMessageFromParams(PACKET_MEMO_CREATE_WITH_DIFFERENT_MEMO_TYPE_ERROR, [["type", "memo"], ["type_1", "invoice"], ["stock_id", `${stock_list[index].stock_id}`], ["memo_type", `${invoice_type == Memo_Invoice_Type.quantity ? Memo_Invoice_Type.carat : Memo_Invoice_Type.quantity}`]]))
                }

                const findInvoiceExist = await Invoice.count({
                    where: { creation_type: Memo_Invoice_creation.Packet },
                    include: [{ model: InvoiceDetail, as: "invoice_details", attributes: ["id", "stock_id", "invoice_type"], where: { invoice_type: { [Op.ne]: invoice_type }, stock_id: findStock?.dataValues.id } }],
                });

                if (findInvoiceExist && findInvoiceExist > 0) {
                    stockError.push(prepareMessageFromParams(PACKET_MEMO_CREATE_WITH_DIFFERENT_MEMO_TYPE_ERROR, [["type", "invoice"], ["type_1", "invoice"], ["stock_id", `${stock_list[index].stock_id}`], ["memo_type", `${invoice_type == Memo_Invoice_Type.quantity ? Memo_Invoice_Type.carat : Memo_Invoice_Type.quantity}`]]))
                }

            }

            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else if (!Object.values(Memo_Invoice_Type).includes(invoice_type)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${invoice_type} memo type`]]))
            } else {
                if (!memo_id) {
                    if (invoice_type === Memo_Invoice_Type.carat) {
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
                                stock: findStock?.dataValues?.stock_id,
                                stock_id: findStock.dataValues.id,
                                stock_original_price: findStock.dataValues.rate,
                                stock_price: stock_list[index].rate,
                                quantity: quantity ?? findStock.dataValues.quantity,
                                weight,
                                invoice_type: invoice_type,
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
                                stock: findStock?.dataValues?.stock_id,
                                stock_id: findStock.dataValues.id,
                                stock_original_price: findStock.dataValues.rate,
                                stock_price: stock_list[index].rate,
                                quantity,
                                weight,
                                invoice_type: invoice_type,
                                created_at: getLocalDate(),
                                created_by: session_res.id,
                                is_deleted: DeleteStatus.No,
                            })
                        }
                    }
                } else {
                    totalItemPrice += (stock_list[index].rate * weight);
                    totalWeight += weight;

                    stockList.push({
                        stock: findStock?.dataValues?.stock_id,
                        stock_id: findStock.dataValues.id,
                        stock_original_price: findStock.dataValues.rate,
                        stock_price: stock_list[index].rate,
                        quantity: quantity ?? findStock.dataValues.quantity,
                        weight,
                        invoice_type: invoice_type,
                        created_at: getLocalDate(),
                        created_by: session_res.id,
                        is_deleted: DeleteStatus.No,
                    })
                }
            }
        }

        if (discount_value) {
            if (totalItemPrice <= discount_value) {
                return resBadRequest({ message: "Discount amount should be less than total item price" });
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
                    tax: ((totalItemPrice - discount_value) * Number(taxFind[index].dataValues.value)) / 100
                })
            }
            totalTaxPrice = ((totalItemPrice - discount_value) * totalTax) / 100;
        }

        if (stockError.length > 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]]),
                data: stockError.map(err => err)
            })
        }

        const trn = await dbContext.transaction();

        const lastInvoice = await Invoice.findOne({
            where: {
                company_id: session_res.company_id ? session_res.company_id : company_id
            },
            order: [["invoice_number", "DESC"]],
            transaction: trn,
            attributes: [
                "invoice_number"
            ]
        })

        const totalPrice = (totalItemPrice - discount_value) + totalTaxPrice + shipping_charge_value

        const invoiceNumber = isNaN(Number(lastInvoice?.dataValues.invoice_number)) ? 1 : Number(lastInvoice?.dataValues.invoice_number) + 1;
        try {
            const invoicePayload = {
                invoice_number: invoiceNumber,
                company_id: findCompany.dataValues.id,
                customer_id: findCustomer.dataValues.id,
                created_at: getLocalDate(),
                created_by: session_res.id,
                total_item_price: Number(totalItemPrice.toFixed(2)),
                total_tax_price: Number(totalTaxPrice.toFixed(2)),
                total_weight: Number(totalWeight.toFixed(2)),
                total_price: Number(totalPrice.toFixed(2)),
                shipping_charge: Number(shipping_charge_value.toFixed(2)),
                discount: Number(discount_value.toFixed(2)),
                discount_type,
                total_diamond_count: stockList.length,
                tax_data: taxData,
                remarks,
                contact,
                salesperson,
                status: INVOICE_STATUS.Active,
                ship_via,
                cust_order,
                tracking,
                report_date: report_date ? new Date(report_date) : null,
                creation_type: invoice_creation_type
            };

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

            let stockUpdate: any
            if (invoice_creation_type === Memo_Invoice_creation.Single) {
                stockUpdate = allStock.filter((stock: any) => stockList.map((data: any) => data.stock_id).includes(stock.dataValues.id)).map((stock: any) => ({
                    ...stock.dataValues,
                    status: StockStatus.SOLD,
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
                if (!memo_id) {
                    stockUpdate = allStock.filter((stock: any) => stockList.map((data: any) => data.stock_id).includes(stock.dataValues.id)).map((stock: any) => {
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
                } else {
                    stockUpdate = allStock.filter((stock: any) => stockList.map((data: any) => data.stock_id).includes(stock.dataValues.id)).map((stock: any) => {
                        return {
                            ...stock.dataValues,
                            packet_id: stock.dataValues.stock_id,
                        }
                    })
                }
            }

            if (memo_id) {
                if (invoice_creation_type === Memo_Invoice_creation.Single) {
                    const memoDetail = await MemoDetail.findAll({
                        where: {
                            memo_id,
                            is_deleted: DeleteStatus.No,
                            is_return: DeleteStatus.No
                        },
                        transaction: trn,
                    })
                    const allStock = await Diamonds?.findAll({
                        where: {
                            is_deleted: DeleteStatus.No,
                            status: StockStatus.MEMO
                        },
                        transaction: trn
                    })
                    const memoDetailCheck = allStock?.map((item) => {
                        const stock = memoDetail?.find((s: any) => s.dataValues?.stock_id == item?.dataValues?.id)
                        return stock
                    })

                    if (memoDetailCheck?.length === 0) {
                        await Memo.update({
                            status: MEMO_STATUS.Close,
                        }, {
                            where: {
                                id: memo_id
                            }, transaction: trn
                        })

                        await StockLogs.create({
                            change_at: getLocalDate(),
                            change_by: admin?.dataValues?.first_name + " " + admin?.dataValues?.last_name,
                            change_by_id: admin?.dataValues?.id,
                            log_type: Log_Type.MEMO,
                            reference_id: memo_id,
                            description: `Memo closed and created invoice with ${stockList?.map((item: any) => item?.stock)?.join(", ")}`
                        }, { transaction: trn })
                    }
                } else {
                    let totalMemoWeight = 0;
                    let totalMemoItemPrice = 0;

                    const memoDetail = await MemoDetail.findAll({
                        where: {
                            memo_id: findMemo?.dataValues?.id,
                            is_deleted: DeleteStatus.No,
                            is_return: DeleteStatus.No
                        },
                        transaction: trn
                    })

                    const memoDetailUpdate: any = memoDetail?.map((item) => {
                        const findStock = stockList?.find((stock: any) => stock?.stock_id == item?.dataValues?.stock_id)

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

                    const totalMemoPrice = ((totalMemoItemPrice - Number(findMemo?.dataValues?.discount ?? 0)) + Number(findMemo?.dataValues?.shipping_charge ?? 0))

                    const memoStatus = (Number(findMemo?.dataValues?.total_weight) - totalMemoWeight) === 0 ? MEMO_STATUS.Close : MEMO_STATUS.Active

                    await Memo.update({
                        total_item_price: totalMemoItemPrice,
                        total_price: totalMemoPrice,
                        total_weight: Number(findMemo?.dataValues?.total_weight) - totalMemoWeight,
                        status: memoStatus
                    }, {
                        where: {
                            id: findMemo?.dataValues?.id
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
                            description: `Created invoice with ${stockList?.map((item: any) => item?.stock)?.join(", ")}`
                        }, { transaction: trn })
                    }

                    await StockLogs.create({
                        change_at: getLocalDate(),
                        change_by: admin?.dataValues?.first_name + " " + admin?.dataValues?.last_name,
                        change_by_id: admin?.dataValues?.id,
                        log_type: Log_Type.INVOICE,
                        reference_id: invoiceId,
                        description: `Created invoice with ${stockList?.map((item: any) => item?.stock)?.join(", ")}`
                    }, { transaction: trn })
                }
            }

            const adminMail = {
                toEmailAddress: session_res.id_role == 0 ? ADMIN_MAIL : admin?.dataValues.email,
                contentTobeReplaced: {
                    admin_name: admin?.dataValues.first_name,
                    customer_name: findCustomer.dataValues.user.dataValues.first_name + " " + findCustomer.dataValues.user.dataValues.last_name,
                    customer_email: findCustomer.dataValues.user.dataValues.email,
                    customer_company: findCustomer.dataValues.company_name,
                    customer_contact: findCustomer.dataValues.user.dataValues.phone_number,
                    invoice_number: invoiceData.dataValues.invoice_number,
                    total: Number(invoiceData.dataValues.total_price).toFixed(2),
                    total_item_price: Number(invoiceData.dataValues.total_item_price).toFixed(2),
                    total_weight: Number(invoiceData.dataValues.total_weight).toFixed(2),
                    total_diamond: invoiceData.dataValues.total_diamond_count,
                    total_tax: Number(invoiceData.dataValues.total_tax_price).toFixed(2),
                    created_at: new Date(invoiceData.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    data: stockUpdate.map((diamond: any) => ({
                        shape: diamond.shape_name,
                        weight: diamond.remain_weight,
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
                    total: Number(invoiceData.dataValues.total_price).toFixed(2),
                    total_item_price: Number(invoiceData.dataValues.total_item_price).toFixed(2),
                    total_weight: Number(invoiceData.dataValues.total_weight).toFixed(2),
                    total_diamond: invoiceData.dataValues.total_diamond_count,
                    total_tax: Number(invoiceData.dataValues.total_tax_price).toFixed(2),
                    created_at: new Date(invoiceData.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    data: stockUpdate.map((diamond: any) => ({
                        shape: diamond.shape_name,
                        weight: diamond.remain_weight,
                        color: diamond.color_name,
                        clarity: diamond.clarity_name,
                        rate: stockListWithInvoiceId.find((stock: { stock_id: any; }) => stock.stock_id === diamond.id)?.stock_price,
                        stock_id: diamond.stock_id,
                        product_image: diamond.image,
                    }))
                },
            }

            await StockLogs.create({
                change_at: getLocalDate(),
                change_by: admin?.dataValues?.first_name + " " + admin?.dataValues?.last_name,
                change_by_id: admin?.dataValues?.id,
                log_type: Log_Type.INVOICE,
                reference_id: invoiceId,
                description: `Invoice created with ${stockList?.map((item: any) => item?.stock)?.join(", ")}`
            }, { transaction: trn })

            await mailAdminInvoice(adminMail);
            await mailCustomerInvoice(customerMail);

            await trn.commit();
            await refreshMaterializedDiamondListView()

            return resSuccess()
        } catch (error) {
            console.log(error)
            await trn.rollback();
            throw error
        }

    } catch (error) {
        throw error
    }
}

export const closeInvoice = async (req: Request) => {
    try {
        const { invoice_id } = req.params
        const stockError = [];
        const stockList = [];

        const invoice = await Invoice.findOne({
            where: {
                id: invoice_id,
                status: INVOICE_STATUS.Active
            },
            include: [
                {
                    model: InvoiceDetail,
                    as: 'invoice_details',
                }
            ]
        })

        if (!(invoice && invoice.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Invoice"]])
            })
        }

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                status: StockStatus.SOLD
            }
        })

        const stockData = invoice.dataValues.invoice_details.map((data: any) => data.dataValues.stock_id)

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

            await Invoice.update({
                status: INVOICE_STATUS.Close,
            }, {
                where: {
                    id: invoice.dataValues.id
                },
                transaction: trn
            })

            await trn.commit();
            await refreshMaterializedDiamondListView()

            return resSuccess()

        } catch (error) {
            trn.rollback();
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

        const logs = await StockLogs.findAll({
            where: {
                reference_id: invoice_id,
                log_type: Log_Type.INVOICE,
            }
        })

        return resSuccess({
            data: {
                ...invoice[0],
                logs: logs
            }
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
                OR invoice_list.email ILIKE '%${pagination.search_text}%'
                OR invoice_list.phone_number ILIKE '%${pagination.search_text}%'
                OR CAST(invoice_list.total_price AS text) ILIKE '%${pagination.search_text}%'
                OR CAST(invoice_list.total_weight as text) ILIKE '%${pagination.search_text}%'
            END
            ${customer ? `AND invoice_list.customer_id IN (${customer})` : ""}
            ${req.body.session_res.id_role != 0 ? `AND invoice_list.company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND invoice_list.company_id = ${query.company}` : ""}`}
            ${query.creation_type ? `AND invoice_list.creation_type = '${query.creation_type}'` : ''}
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
                OR invoice_list.email ILIKE '%${pagination.search_text}%'
                OR invoice_list.phone_number ILIKE '%${pagination.search_text}%'
                OR CAST(invoice_list.total_price AS text) ILIKE '%${pagination.search_text}%'
                OR CAST(invoice_list.total_weight as text) ILIKE '%${pagination.search_text}%'
            END
            ${customer ? `AND invoice_list.customer_id IN (${customer})` : ""}
            ${req.body.session_res.id_role != 0 ? `AND invoice_list.company_id = ${req.body.session_res.company_id}` : `${query.company ? `AND invoice_list.company_id = ${query.company}` : ""}`}
            ${query.creation_type ? `AND invoice_list.creation_type = '${query.creation_type}'` : ''}
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
            data: noPagination ? totalItems : { pagination, result: invoiceList }
        });

    } catch (error) {
        throw error;
    }
}