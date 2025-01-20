import { Request } from "express";
import { resBadRequest, resSuccess } from "../../utils/shared-functions";
import dbContext from "../../config/dbContext";
import { QueryTypes } from "sequelize";

export const compareDiamonds = async (req: Request) => {
    const { product_id } = req.body;

    if (product_id.length === 0) {
        return resBadRequest({
            message: "Product ID is required."
        })
    }

    const compareDiamonds = await dbContext.query(
        `
            SELECT * FROM diamond_list where id in (${product_id.map((id: number) => `${id}`).join(",")}) 
        `, { type: QueryTypes.SELECT }
    );

    return resSuccess({ data: compareDiamonds });
}