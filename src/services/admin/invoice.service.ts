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
import { resNotFound, prepareMessageFromParams, getLocalDate, resSuccess } from "../../utils/shared-functions";
import Master from "../../model/masters.model";

export const createInvoice = async (req: Request) => {
    try {
        const { company_id, customer_id, stock_list } = req.body
        const stockError = [];
        const stockList: any = [];

        const findCompany = await Company.findOne({
            where: {
                id: company_id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active,
            }
        })

        if (!(findCompany && findCompany.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Company"]])
            })
        }

        const taxFind = await Master.findOne({
            where: {
                master_type: Master_type.Tax,
                country_id: findCompany.dataValues.country_id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        if (!(taxFind && taxFind.dataValues)) {
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
            where: {
                is_deleted: DeleteStatus.No,
                company_id: company_id,
                status: StockStatus.AVAILABLE
            }
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
                is_deleted: DeleteStatus.No,
                company_id: company_id,
            }
        })

        const invoiceNumber = invoiceList[invoiceList.length - 1] ? Number(invoiceList[invoiceList.length - 1].dataValues.invoice_number) + 1 : 1;
        try {
            const invoicePayload = {
                invoice_number: invoiceNumber,
                company_id: findCompany.dataValues.id,
                customer_id: findCustomer.dataValues.id,
                tax_id: taxFind.dataValues.id,
                created_at: getLocalDate(),
                created_by: req.body.session_res.id,
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

            trn.commit();
            return resSuccess()
        } catch (error) {
            trn.rollback();
            throw error
        }

    } catch (error) {
        throw error
    }
}
