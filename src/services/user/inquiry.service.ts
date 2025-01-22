import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { DeleteStatus, StockStatus } from "../../utils/app-enumeration";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import { resNotFound, prepareMessageFromParams, resSuccess, getLocalDate, resUnknownError, getInitialPaginationFromQuery, getCurrencyPrice } from "../../utils/shared-functions";
import Inquiry from "../../model/inquiry.model";
import ProductInquiry from "../../model/product-inquiry.model";
import dbContext from "../../config/dbContext";
import { ADMIN_MAIL, ORDER_NUMBER_IDENTITY } from "../../config/env.var";
import CartProducts from "../../model/cart-product.model";
import { Op, QueryTypes, Sequelize } from "sequelize";
import { mailAdminInquiry, mailAdminProductInquiry, mailCustomerInquiry, mailCustomerProductInquiry } from "../mail.service";
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

        const adminMail = {
            toEmailAddress: ADMIN_MAIL,
            contentTobeReplaced: {
                full_name: findProduct.dataValues.full_name,
                email: findProduct.dataValues.email,
                phone_number: findProduct.dataValues.phone_number,
                message: findProduct.dataValues.message,
                data: [
                    {
                        shape: findProduct.dataValues.shape,
                        weight: findProduct.dataValues.weight,
                        color: findProduct.dataValues.color,
                        clarity: findProduct.dataValues.clarity,
                        rate: findProduct.dataValues.rate,
                        stock_id: findProduct.dataValues.stock_id,
                        product_image: findProduct.dataValues.image,
                    }
                ]
            },
        };

        const customerMail = {
            toEmailAddress: email,
            contentTobeReplaced: {
                data: [
                    {
                        shape: findProduct.dataValues.shape,
                        weight: findProduct.dataValues.weight,
                        color: findProduct.dataValues.color,
                        clarity: findProduct.dataValues.clarity,
                        rate: findProduct.dataValues.rate,
                        stock_id: findProduct.dataValues.stock_id,
                        product_image: findProduct.dataValues.image,
                    }
                ]
            },
        }

        await mailAdminProductInquiry(adminMail);
        await mailCustomerProductInquiry(customerMail);

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

        if (userCart.length === 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Cart items"],
                ]),
            })
        }

        const cart_product = userCart.map((product) => ({ product_id: product.dataValues.product_id, quantity: product.dataValues.quantity }))

        let total = 0;
        for (let index = 0; index < userCart.length; index++) {
            const item = userCart[index].dataValues;
            const itemPrice = item.product.rate * item.product.weight
            total += item.quantity * itemPrice;
        }

        const diamonds = await dbContext.query(
            `SELECT * FROM diamond_list where status = '${StockStatus.AVAILABLE}'`, { type: QueryTypes.SELECT }
        )
        let product_details = [];

        try {
            for (let product of cart_product) {
                const products: any = diamonds.find((i: any) => i.id == product.product_id);
                if (!(products && products)) {
                    await trn.rollback();
                    return resNotFound({
                        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                            ["field_name", "Diamond product"],
                        ]),
                    });
                }
                product_details.push({
                    ...products,
                    quantity: product.quantity,
                    weight: products.weight * product.quantity,
                    product_image: products.image,
                });
            }

            const inquiryPayload = {
                inquiry_number: `${ORDER_NUMBER_IDENTITY}-${inquiry_number}`,
                user_id: user_id,
                total: total,
                inquiry_note: inquiry_note,
                email: email,
                inquiry_address: inquiry_address,
                product_details: product_details,
                created_by: user_id,
                created_at: getLocalDate(),
            };

            const inquiry = await Inquiry.create(inquiryPayload, { transaction: trn });

            CartProducts.destroy({
                where: { user_id: user_id },
                transaction: trn,
            })

            let total_weight = 0;
            for (let item of product_details) {
                total_weight += item.weight;
            }

            const adminMail = {
                toEmailAddress: ADMIN_MAIL,
                contentTobeReplaced: {
                    inquiry_number: inquiry.dataValues.inquiry_number,
                    total: total.toFixed(2),
                    email: email,
                    total_weight,
                    created_at: new Date(inquiry.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    address: {
                        full_name: inquiry_address.first_name + ' ' + inquiry_address.last_name,
                        address: inquiry_address.address,
                        phone_number: inquiry_address.phone_number,
                        city: inquiry_address.city,
                        state: inquiry_address.state,
                        country: inquiry_address.country,
                        postcode: inquiry_address.postcode,
                    },
                    data: product_details,
                },
            };

            const customerMail = {
                toEmailAddress: email,
                contentTobeReplaced: {
                    inquiry_number: inquiry.dataValues.inquiry_number,
                    total: total.toFixed(2),
                    total_weight,
                    created_at: new Date(inquiry.dataValues.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    data: product_details,
                },
            }

            await mailAdminInquiry(adminMail);
            await mailCustomerInquiry(customerMail)

            await trn.commit();

            return resSuccess({ data: inquiry.dataValues.inquiry_number });
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
        const currency = await getCurrencyPrice(req.query.currency as string);
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
                [Sequelize.literal(`(total * ${currency})`), 'total'],
                "inquiry_note",
                "email",
                "inquiry_address",
                "created_at",
                [
                    Sequelize.literal(`product_details`),
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
        const { inquiry_number } = req.params;
        const currency = await getCurrencyPrice(req.query.currency as string);

        const inquiry = await Inquiry.findOne({
            where: {
                inquiry_number: inquiry_number,
                user_id: req.body.session_res.id,
            },
            attributes: [
                "inquiry_number",
                [Sequelize.literal(`(total * ${currency})`), 'total'],
                "inquiry_note",
                "email",
                "inquiry_address",
                "created_at",
                [
                    Sequelize.literal(`product_details`),
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