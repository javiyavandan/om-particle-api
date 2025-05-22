import { Request } from "express";
import Company from "../../model/companys.model";
import { ActiveStatus, DeleteStatus, StockStatus, TransferStatus, TransferStockStatus } from "../../utils/app-enumeration";
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, refreshMaterializedViews, refreshStockTransferMaterializedView, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import Diamonds from "../../model/diamond.model";
import dbContext from "../../config/dbContext";
import StockTransfer from "../../model/stock-transfer.model";
import TransferDetails from "../../model/transfer-details.model";
import { QueryTypes } from "sequelize";

export const CreateTransferRequest = async (req: Request) => {
    let trn;
    try {
        const {
            receiver,
            sender,
            consignment_details,
            stock_list,
            session_res
        } = req.body
        const stockArray: any = [];
        const stockError = [];
        let totalWeight = 0;
        let totalQuantity = 0;
        let totalPrice = 0;

        if (receiver == sender) {
            return resBadRequest({
                message: "Receiver and Sender cannot be same"
            })
        }

        const findReceiver = await Company.findOne({
            where: {
                id: receiver,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        const findSender = await Company.findOne({
            where: {
                id: sender,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        if (!(findReceiver && findReceiver.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Receiver"]])
            })
        }

        if (!(findSender && findSender.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Sender"]])
            })
        }

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                status: StockStatus.AVAILABLE,
                company_id: sender
            }
        })

        for (let i = 0; i < stock_list.length; i++) {
            const stock = stock_list[i];
            const findStock = allStock?.find((item) => item.dataValues?.stock_id === stock?.stock_id)
            if (!(findStock && findStock?.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stock} Stock`]]))

                continue;
            } else {
                stockArray.push({
                    stock_id: findStock?.dataValues?.id,
                    sender_price: findStock?.dataValues?.rate,
                    receiver_price: stock?.receiver_price,
                })

                totalQuantity += Number(findStock?.dataValues?.quantity);
                totalWeight += Number(findStock?.dataValues?.weight);
                totalPrice += (stock?.receiver_price * Number(findStock?.dataValues?.weight)) * Number(findStock?.dataValues?.quantity);

                continue;
            }
        }

        const averageAmount = totalPrice / totalWeight;

        if (stockError.length > 0) {
            return resBadRequest({
                data: stockError
            })
        }

        trn = await dbContext.transaction();

        const newTransfer = {
            receiver,
            sender,
            consignment_details: {
                ...consignment_details,
                total_amount: totalPrice?.toFixed(2),
                total_quantity: totalQuantity,
                total_weight: totalWeight?.toFixed(2),
                average_amount: averageAmount?.toFixed(2),
            },
            status: TransferStatus.Created,
            created_by: session_res.id,
            created_at: getLocalDate(),
        }

        const transferRequest = await StockTransfer.create(newTransfer, { transaction: trn })

        const transferStockDetails = stockArray?.map((item: any) => {
            return {
                stock_id: item?.stock_id,
                transfer_id: transferRequest?.dataValues?.id,
                sender_price: item?.sender_price,
                receiver_price: item?.receiver_price,
            }
        })

        await TransferDetails.bulkCreate(transferStockDetails, { transaction: trn })

        const stockUpdateArray = stockArray?.map((item: any) => {
            const findStock = allStock?.find((stock: any) => stock?.dataValues?.id === item?.stock_id)
            return {
                ...findStock?.dataValues,
                status: StockStatus.ONHOLD
            }
        })

        await Diamonds.bulkCreate(stockUpdateArray, {
            updateOnDuplicate: ["status"],
            transaction: trn
        })

        await trn.commit();
        await refreshMaterializedViews()
        await refreshStockTransferMaterializedView()
        return resSuccess({ message: "Transfer Request Created Successfully" })

    } catch (error) {
        if (trn) {
            trn.rollback();
        }
        throw error
    }
}

export const AcceptStockTransferRequest = async (req: Request) => {
    let trn;
    try {
        const { transfer_id } = req.params;
        const { session_res } = req.body;
        const transfer = await StockTransfer.findOne({
            where: {
                id: transfer_id,
            }
        })

        if (!(transfer && transfer.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Transfer Request"]])
            })
        }

        switch (transfer?.dataValues?.status) {
            case TransferStatus.Created:
                break;

            case TransferStatus.Closed:
                return resBadRequest({
                    message: "Transfer Request is already closed"
                })

            case TransferStatus.Return:
                return resBadRequest({
                    message: "Transfer Request is already returned"
                })

            case TransferStatus.Rejected:
                return resBadRequest({
                    message: "Transfer Request is rejected now cannot be accepted"
                })

            case TransferStatus.Accepted:
                return resBadRequest({
                    message: "Transfer Request is already accepted"
                })

            default:
                return resBadRequest({
                    message: "Transfer Request is not found"
                })
        }

        trn = await dbContext.transaction();

        await StockTransfer.update({
            status: TransferStatus.Accepted,
            accepted_by: session_res.id,
            accepted_at: getLocalDate(),
        }, {
            where: {
                id: transfer.dataValues.id
            },
            transaction: trn
        });

        const transferDetails = await TransferDetails.findAll({
            where: {
                transfer_id: transfer.dataValues.id
            },
            transaction: trn
        })

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                status: StockStatus.ONHOLD,
                company_id: transfer.dataValues.sender
            },
            transaction: trn
        })

        const stockUpdateArray = transferDetails?.map((item) => {
            const findStock = allStock?.find((stock: any) => stock?.dataValues?.id === item?.dataValues?.stock_id)
            return {
                ...findStock?.dataValues,
                company_id: transfer.dataValues.receiver,
                rate: item?.dataValues?.receiver_price,
                status: StockStatus.AVAILABLE
            }
        })

        await Diamonds.bulkCreate(stockUpdateArray, {
            updateOnDuplicate: ["company_id", "status", "rate"],
            transaction: trn
        })

        await trn.commit();
        await refreshMaterializedViews()
        await refreshStockTransferMaterializedView()
        return resSuccess({ message: "Transfer Request Accepted Successfully" })

    } catch (error) {
        if (trn) {
            trn.rollback();
        }
        throw error
    }
}

export const RejectStockTransferRequest = async (req: Request) => {
    let trn;
    try {
        const { transfer_id } = req.params;
        const { session_res } = req.body;
        const transfer = await StockTransfer.findOne({
            where: {
                id: transfer_id,
            }
        })

        if (!(transfer && transfer.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Transfer Request"]])
            })
        }

        switch (transfer?.dataValues?.status) {
            case TransferStatus.Created:
                break;

            case TransferStatus.Closed:
                return resBadRequest({
                    message: "Transfer Request is already closed"
                })

            case TransferStatus.Return:
                return resBadRequest({
                    message: "Transfer Request is already returned"
                })

            case TransferStatus.Rejected:
                return resBadRequest({
                    message: "Transfer Request is already rejected"
                })

            case TransferStatus.Accepted:
                return resBadRequest({
                    message: "Transfer Request is accepted now cannot be rejected"
                })

            default:
                return resBadRequest({
                    message: "Transfer Request is not found"
                })
        }

        trn = await dbContext.transaction();

        await StockTransfer.update({
            status: TransferStatus.Rejected,
            rejected_by: session_res.id,
            rejected_at: getLocalDate(),
        }, {
            where: {
                id: transfer.dataValues.id
            },
            transaction: trn
        });

        const transferDetails = await TransferDetails.findAll({
            where: {
                transfer_id: transfer.dataValues.id
            },
            transaction: trn
        })

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                status: StockStatus.ONHOLD,
                company_id: transfer.dataValues.sender
            },
            transaction: trn
        })

        const stockUpdateArray = allStock?.filter((item) => {
            return transferDetails?.find((stock: any) => stock?.dataValues?.stock_id === item?.dataValues?.id)
        })?.map((item) => {
            return {
                ...item.dataValues,
                status: StockStatus.AVAILABLE,
            }
        })

        await Diamonds.bulkCreate(stockUpdateArray, {
            updateOnDuplicate: ["status"],
            transaction: trn
        })

        await trn.commit();
        await refreshMaterializedViews()
        await refreshStockTransferMaterializedView()
        return resSuccess({ message: "Transfer Request Rejected Successfully" })

    } catch (error) {
        if (trn) {
            trn.rollback();
        }
        throw error
    }
}

export const ReturnStockTransferRequest = async (req: Request) => {
    let trn;
    try {
        const { transfer_id } = req.params;
        const {
            consignment_details,
            stock_list,
            session_res
        } = req.body;
        const stockError = [];
        const stockArray = [];
        const stockUpdateArray = [];
        let returnTotalWeight = 0;
        let returnTotalQuantity = 0;
        let returnTotalPrice = 0;

        const transfer = await StockTransfer.findOne({
            where: {
                id: transfer_id,
            }
        })

        if (!(transfer && transfer.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Transfer Request"]])
            })
        }

        switch (transfer?.dataValues?.status) {
            case TransferStatus.Accepted:
                break;

            case TransferStatus.Closed:
                return resBadRequest({
                    message: "Transfer Request is already closed"
                })

            case TransferStatus.Return:
                return resBadRequest({
                    message: "Transfer Request is already returned"
                })

            case TransferStatus.Rejected:
                return resBadRequest({
                    message: "Transfer Request is rejected"
                })

            case TransferStatus.Created:
                return resBadRequest({
                    message: "Transfer Request is not accepted yet"
                })

            default:
                return resBadRequest({
                    message: "Transfer Request is not found"
                })
        }

        const transferDetails = await TransferDetails.findAll({
            where: {
                transfer_id: transfer.dataValues.id
            }
        })

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                company_id: transfer?.dataValues?.receiver
            }
        })

        for (let i = 0; i < stock_list.length; i++) {
            const stock = stock_list[i];
            const findStock = allStock?.find((item: any) => item?.dataValues?.stock_id === stock?.stock_id)
            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `Stock ${stock?.stock_id}`]]))
                continue;
            } else {
                const findStockFromTransfer = transferDetails?.find((item: any) => item?.dataValues?.stock_id === findStock?.dataValues?.id)
                if (!(findStockFromTransfer && findStockFromTransfer.dataValues)) {
                    stockError.push(`Stock ${stock?.stock_id} not found in Transfer Request`)
                    continue;
                } else {
                    stockArray.push({
                        ...findStockFromTransfer.dataValues,
                        status: stock?.status
                    })

                    if (stock?.status === TransferStockStatus.Return) {
                        stockUpdateArray.push({
                            ...findStock?.dataValues,
                            status: StockStatus.ONHOLD,
                        })
                        returnTotalQuantity += Number(findStock?.dataValues?.quantity);
                        returnTotalWeight += Number(findStock?.dataValues?.weight);
                        returnTotalPrice += (Number(findStockFromTransfer?.dataValues?.sender_price) * Number(findStock?.dataValues?.weight)) * Number(findStock?.dataValues?.quantity);
                    }

                    continue;
                }
            }
        }

        const returnAverageAmount = returnTotalPrice / returnTotalWeight;

        if (stockError.length > 0) {
            return resBadRequest({
                data: stockError
            })
        }

        trn = await dbContext.transaction();

        await StockTransfer.update({
            return_details: {
                ...consignment_details,
                return_total_quantity: returnTotalQuantity?.toFixed(2),
                return_total_weight: returnTotalWeight?.toFixed(2),
                return_total_price: returnTotalPrice?.toFixed(2),
                return_average_amount: returnAverageAmount?.toFixed(2),
            },
            status: TransferStatus.Return,
            return_by: session_res.id,
            return_at: getLocalDate(),
        }, {
            where: {
                id: transfer.dataValues.id
            },
            transaction: trn
        });

        await TransferDetails.bulkCreate(stockArray, {
            updateOnDuplicate: ["status"],
            transaction: trn
        });

        await Diamonds.bulkCreate(stockUpdateArray, {
            updateOnDuplicate: ["status"],
            transaction: trn
        });

        await trn.commit();
        await refreshMaterializedViews()
        await refreshStockTransferMaterializedView()
        return resSuccess({ message: "Transfer Request Returned Successfully" })

    } catch (error) {
        if (trn) {
            trn.rollback();
        }
        throw error
    }
}

export const CloseTransferRequest = async (req: Request) => {
    let trn;
    try {
        const { transfer_id } = req.params;
        const { session_res } = req.body;
        const transfer = await StockTransfer.findOne({
            where: {
                id: transfer_id,
            }
        })

        if (!(transfer && transfer.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Transfer Request"]])
            })
        }

        switch (transfer?.dataValues?.status) {
            case TransferStatus.Return:
                break;

            case TransferStatus.Closed:
                return resBadRequest({
                    message: "Transfer Request is already closed"
                })

            case TransferStatus.Accepted:
                return resBadRequest({
                    message: "Transfer Request is not returned yet"
                })

            case TransferStatus.Rejected:
                return resBadRequest({
                    message: "Transfer Request is rejected"
                })

            case TransferStatus.Created:
                return resBadRequest({
                    message: "Transfer Request is not accepted yet"
                })

            default:
                return resBadRequest({
                    message: "Transfer Request is not found"
                })
        }

        trn = await dbContext.transaction();

        await StockTransfer.update({
            status: TransferStatus.Closed,
            close_by: session_res.id,
            close_at: getLocalDate(),
        }, {
            where: {
                id: transfer.dataValues.id
            },
            transaction: trn
        });

        const transferDetails = await TransferDetails.findAll({
            where: {
                transfer_id: transfer.dataValues.id,
                status: TransferStockStatus.Return
            }
        })

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                status: StockStatus.ONHOLD,
                company_id: transfer?.dataValues?.receiver
            }
        })

        const stockUpdateArray = transferDetails?.map((item) => {
            const findStock = allStock?.find((stock: any) => stock?.dataValues?.id === item?.dataValues?.stock_id)
            return {
                ...findStock?.dataValues,
                company_id: transfer?.dataValues?.sender,
                rate: item?.dataValues?.sender_price,
                status: StockStatus.AVAILABLE,
            }
        })

        await Diamonds.bulkCreate(stockUpdateArray, {
            updateOnDuplicate: ["status", "company_id", "rate"],
            transaction: trn
        })

        await trn.commit();
        await refreshMaterializedViews()
        await refreshStockTransferMaterializedView()
        return resSuccess({ message: "Transfer Request Closed Successfully" })

    } catch (error) {
        if (trn) {
            trn.rollback();
        }
        throw error
    }
}

export const GetAllTransferRequest = async (req: Request) => {
    try {
        const { query } = req;
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text ?? "0",
        };
        let noPagination = req.query.no_pagination === "1";

        const sqlQuery = `
            SELECT * FROM stock_transfer_list
            WHERE 
            CASE WHEN '${pagination.search_text}' = '0' THEN TRUE ELSE
                        sender_name ILIKE '%${pagination.search_text}%'
                        OR receiver_name ILIKE '%${pagination.search_text}%'
                        OR consignment_details->>'delivery_challan_no' ILIKE '%${pagination.search_text}%'
            END
               ${req.body.session_res.id_role != 0
                ? `AND (sender = ${req.body.session_res.company_id} OR receiver = ${req.body.session_res.company_id})`
                : (query.company
                    ? `AND (sender = ${query.company} OR receiver = ${query.company})`
                    : ""
                )
            }
            ${query.start_date && query.end_date
                ? `AND created_at BETWEEN '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0, 0)).toISOString()}' AND '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
                : ""}
                              ${query.start_date && !query.end_date
                ? `AND created_at >= '${new Date(new Date(query.start_date as string).setUTCHours(0, 0, 0)).toISOString()}'`
                : ""}
                              ${!query.start_date && query.end_date
                ? `AND created_at <= '${new Date(new Date(query.end_date as string).setUTCHours(23, 59, 59, 999)).toISOString()}'`
                : ""}
                ORDER BY ${pagination.sort_by} ${pagination.order_by}
        `

        const totalItems = await dbContext.query(
            `
                ${sqlQuery}
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
                ${sqlQuery}
                LIMIT ${pagination.per_page_rows}
                OFFSET ${(pagination.current_page - 1) * pagination.per_page_rows}
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

export const GetTransferRequestById = async (req: Request) => {
    try {
        const { transfer_id } = req.params;

        const result = await dbContext.query(`
                SELECT * FROM stock_transfer_list WHERE id = ${transfer_id}
            `,
            {type: QueryTypes.SELECT}
        )

        if (!result[0]) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Transfer Request"]])
            })
        }

        return resSuccess({ data: result[0] })
    } catch (error) {
        throw error
    }
}