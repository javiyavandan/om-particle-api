import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { DeleteStatus, StockStatus } from "../../utils/app-enumeration";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import { resNotFound, prepareMessageFromParams, resSuccess, getLocalDate, resUnknownError, getInitialPaginationFromQuery } from "../../utils/shared-functions";
import Inquiry from "../../model/inquiry.model";
import ProductInquiry from "../../model/product-inquiry.model";
import dbContext from "../../config/dbContext";
import { ORDER_NUMBER_IDENTITY } from "../../config/env.var";
import CartProducts from "../../model/cart-product.model";
import { Op, Sequelize } from "sequelize";
const crypto = require("crypto");

export const singleProductInquiry = async (req: Request) => {
    try {
        const { full_name, email, phone_number, message, product_id } = req.body

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

        const inquiry = await ProductInquiry.create({
            full_name: full_name,
            email,
            phone_number,
            message,
            product_id,
            created_by: req.body.session_res.id,
            created_at: new Date(),
        })
        // Send the email or any other notification using the findProduct object


        return resSuccess()
    } catch (error) {
        throw error
    }
}

export const addInquiry = async (req: Request) => {
    try {
        const {
            email,
            inquiry_note,
            inquiry_address
        } = req.body;
        const { user_id } = req.body.session_res;

        if (!inquiry_address) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Inquiry address"],
                ]),
            });
        }

        const trn = await dbContext.transaction();
        const inquiry_number = crypto.randomInt(1000000000, 9999999999);

        const userCart = await CartProducts.findAll({
            where: { user_id: user_id },
            include: [
                {
                    model: Diamonds,
                    as: "product",
                    where: {
                        is_deleted: DeleteStatus.No,
                        status: StockStatus.AVAILABLE,
                    },
                    required: true,
                }
            ],
            transaction: trn,
        })

        const product_details = userCart.map((product) => product.dataValues.product_id)

        let total = 0;
        for (let index = 0; index < userCart.length; index++) {
            const item = userCart[index].dataValues;
            total += item.quantity * item.product.rate;
        }

        const diamonds = await Diamonds.findAll({
            where: { is_deleted: DeleteStatus.No, status: StockStatus.AVAILABLE },
            transaction: trn,
        })

        try {
            for (let product of product_details) {
                const products = diamonds.find((i) => i.dataValues.id == product);
                if (!(products && products.dataValues)) {
                    await trn.rollback();
                    return resNotFound({
                        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                            ["field_name", "Diamond product"],
                        ]),
                    });
                }
            }

            const inquiryPayload = {
                inquiry_number: `${ORDER_NUMBER_IDENTITY}-${inquiry_number}`,
                user_id: user_id,
                total: total,
                inquiry_note: inquiry_note,
                email: email,
                inquiry_address: inquiry_address,
                product_details,
                created_by: user_id,
                created_at: getLocalDate(),
            };

            const inquiry = await Inquiry.create(inquiryPayload, { transaction: trn });

            await trn.commit();

            return resSuccess();
        } catch (error) {
            await trn.rollback();
            return resUnknownError({ data: error });
        }
    } catch (error) {
        throw error;
    }
};

export const getInquiries = async (req: Request) => {
    try {
        const { user_id } = req.body.session_res;
        const { query } = req;
        let paginationProps = {};
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text,
        };
        let noPagination = req.query.no_pagination === "1";

        let where = [
            { user_id: user_id },
            pagination.is_active ? { is_active: pagination.is_active } : {},
            pagination.search_text
                ? {
                    [Op.or]: [
                        { email: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { inquiry_number: { [Op.iLike]: `%${pagination.search_text}%` } }
                    ],
                }
                : {},
        ];


        if (!noPagination) {
            const totalItems = await Inquiry.count({
                where,
            });

            if (totalItems === 0) {
                return resSuccess({ data: { pagination, result: [] } });
            }

            pagination.total_items = totalItems;
            pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

            paginationProps = {
                limit: pagination.per_page_rows,
                offset: (pagination.current_page - 1) * pagination.per_page_rows,
            };
        }

        const result = await Inquiry.findAll({
            where,
            ...paginationProps,
            order: [[pagination.sort_by, pagination.order_by]],
            attributes: [
                "inquiry_number",
                "total",
                "inquiry_note",
                "email",
                "inquiry_address",
                [
                    Sequelize.literal(`
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'stock_id', diamonds.stock_id,
                                    'weight', diamonds.weight,
                                    'status', diamonds.status
                                )
                            )
                            FROM diamonds
                            WHERE diamonds.id = ANY (
                                SELECT json_array_elements_text(product_details)::int
                                FROM inquiries
                                WHERE inquiries.id = "inquiries".id
                            )
                        )
                    `),
                    "diamondProduct"
                ]
            ]
        });


        return resSuccess({ data: noPagination ? result : { pagination, result } });

    } catch (error) {
        throw error;
    }
}

export const getInquiryDetail = async (req: Request) => {
    try {
        const { inquiry_id } = req.params;

        const inquiry = await Inquiry.findOne({
            where: {
                id: inquiry_id,
                user_id: req.body.session_res.id,
            },
            attributes: [
                "inquiry_number",
                "total",
                "inquiry_note",
                "email",
                "inquiry_address",
                [
                    Sequelize.literal(`
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'stock_id', diamonds.stock_id,
                                    'weight', diamonds.weight,
                                    'status', diamonds.status,
                                    'shape', shape_master.name,
                                    'clarity', clarity_master.name,
                                    'color', color_master.name,
                                    'color_intensity', color_intensity_master.name,
                                    'lab', lab_master.name,
                                    'polish', polish_master.name,
                                    'symmetry', symmetry_master.name,
                                    'fluorescence', fluorescence_master.name,
                                    'company', companys.name,
                                    'quantity', diamonds.quantity,
                                    'rate', diamonds.rate,
                                    'video', diamonds.video,
                                    'image', diamonds.image,
                                    'certificate', diamonds.certificate,
                                    'report', diamonds.report,
                                    'measurement_height', diamonds.measurement_height,
                                    'measurement_width', diamonds.measurement_width,
                                    'measurement_depth', diamonds.measurement_depth,
                                    'table_value', diamonds.table_value,
                                    'depth_value', diamonds.depth_value,
                                    'ratio', diamonds.ratio,
                                    'local_location', diamonds.local_location,
                                    'user_comments', diamonds.user_comments,
                                    'admin_comments', diamonds.admin_comments
                                )
                            )
                            FROM diamonds
                            LEFT JOIN masters AS shape_master ON shape_master.id = diamonds.shape
                            LEFT JOIN masters AS clarity_master ON clarity_master.id = diamonds.clarity
                            LEFT JOIN masters AS color_master ON color_master.id = diamonds.color
                            LEFT JOIN masters AS color_intensity_master ON color_intensity_master.id = diamonds.color_intensity
                            LEFT JOIN masters AS lab_master ON lab_master.id = diamonds.lab
                            LEFT JOIN masters AS polish_master ON polish_master.id = diamonds.polish
                            LEFT JOIN masters AS symmetry_master ON symmetry_master.id = diamonds.symmetry
                            LEFT JOIN masters AS fluorescence_master ON fluorescence_master.id = diamonds.fluorescence
                            LEFT JOIN companys ON companys.id = diamonds.company_id
                            WHERE diamonds.is_deleted = '0' AND diamonds.id = ANY (
                                SELECT json_array_elements_text(product_details)::int
                                FROM inquiries
                                WHERE inquiries.id = ${inquiry_id}
                            )
                        )
                    `),
                    "diamondProduct"
                ]
            ]
        });
        

        if (!(inquiry && inquiry.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Inquiry"],
                ]),
            })
        }

        return resSuccess({ data: inquiry })

    } catch (error) {
        throw error
    }
}