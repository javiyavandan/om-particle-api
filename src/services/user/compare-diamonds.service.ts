import { Request } from "express";
import { resSuccess } from "../../utils/shared-functions";
import dbContext from "../../config/dbContext";
import { QueryTypes } from "sequelize";

export const compareDiamonds = async (req: Request) => {
    const { product_id } = req.body;
    const compareDiamonds = await dbContext.query(
        `
            SELECT * FROM diamond_list where id in (${product_id.map((id: number) => `${id}`).join(",")}) 
        `, { type: QueryTypes.SELECT }
    );

    return resSuccess({ data: compareDiamonds });
}