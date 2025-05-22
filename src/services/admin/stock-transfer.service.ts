import { Request } from "express";
import Company from "../../model/companys.model";
import { ActiveStatus, DeleteStatus, StockStatus, TransferStatus } from "../../utils/app-enumeration";
import { getLocalDate, prepareMessageFromParams, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import Diamonds from "../../model/diamond.model";
import dbContext from "../../config/dbContext";
import StockTransfer from "../../model/stock-transfer.model";
import TransferDetails from "../../model/transfer-details.model";

export const CreateTransferRequest = async (req: Request) => {
    let trn;
    try {
        const {
            receiver,
            sender,
            delivery_challan_no,
            pre_carriage,
            vessels_flight_no,
            hsn_code,
            description,
            diamond_description,
            consignment_remarks,
            stock_list,
            session_res
        } = req.body
        const stockArray = [];
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
                    stock_id: findStock?.dataValues?.stock_id,
                    sender_price: findStock?.dataValues?.rate,
                    receiver_price: stock?.receiver_price,
                })

                totalQuantity += findStock?.dataValues?.quantity;
                totalWeight += findStock?.dataValues?.weight;
                totalPrice += (stock?.receiver_price * findStock?.dataValues?.weight) * findStock?.dataValues?.quantity;

                continue;
            }
        }

        const averageAmount = totalPrice / totalWeight;

        trn = await dbContext.transaction();

        const newTransfer = {
            receiver,
            sender,
            delivery_challan_no,
            pre_carriage,
            vessels_flight_no,
            hsn_code,
            description,
            diamond_description,
            consignment_remarks,
            total_amount: totalPrice?.toFixed(2),
            total_quantity: totalQuantity,
            total_weight: totalWeight?.toFixed(2),
            average_amount: averageAmount?.toFixed(2),
            status: TransferStatus.Created,
            created_by: session_res.id,
            created_at: getLocalDate(),
        }

        const transferRequest = await StockTransfer.create(newTransfer, { transaction: trn })

        const transferStockDetails = stockArray?.map((item) => {
            return {
                stock_id: item?.stock_id,
                transfer_id: transferRequest?.dataValues?.transfer_id,
                sender_price: item?.sender_price,
                receiver_price: item?.receiver_price,
            }
        })

        await TransferDetails.bulkCreate(transferStockDetails, { transaction: trn })

        await trn.commit();
        return resSuccess({ message: "Transfer Request Created Successfully" })

    } catch (error) {
        if (trn) {
            trn.rollback();
        }
        throw error
    }
}