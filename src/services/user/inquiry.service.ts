import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { DeleteStatus } from "../../utils/app-enumeration";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import { resNotFound, prepareMessageFromParams, resSuccess } from "../../utils/shared-functions";
import Inquiry from "../../model/inquiry.model";

export const singleProductInquiry = async (req: Request) => {
    try {
        const { name, email, phone_number, message, product_id } = req.body

        const findProduct = await Diamonds.findOne({
            where: {
                id: product_id,
                is_deleted: DeleteStatus.No,
            }
        })

        if (!(findProduct && findProduct.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Product"],
                ]),
            })
        }

        const inquiry = await Inquiry.create({
            name,
            email,
            phone_number,
            message,
            product_id,
            created_by: req.body.session_res.id,
            created_at: new Date(),
        })
        // Send the email or any other notification using the findProduct object


        return resSuccess({
            data: inquiry,
        })
    } catch (error) {
        throw error
    }
}