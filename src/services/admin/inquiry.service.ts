import { Request } from 'express';
import { getInitialPaginationFromQuery, prepareMessageFromParams, resNotFound, resSuccess } from '../../utils/shared-functions';
import { Op, Sequelize } from 'sequelize';
import Inquiry from '../../model/inquiry.model';
import { ERROR_NOT_FOUND, RECORD_UPDATE } from '../../utils/app-messages';
import Diamonds from '../../model/diamond.model';
import Master from '../../model/masters.model';
import Company from '../../model/companys.model';

export const SingleProductInquiryList = async (req: Request) => {
    try {
        const { query } = req;
        let paginationProps = {};
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text,
        };
        let noPagination = req.query.no_pagination === "1";

        let where = [
            pagination.is_active ? { is_active: pagination.is_active } : {},
            pagination.search_text
                ? {
                    [Op.or]: [
                        { name: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { phone_number: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { email: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { message: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { admin_comments: { [Op.iLike]: `%${pagination.search_text}%` } },
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
            ...paginationProps,
            order: [[pagination.sort_by, pagination.order_by]],
            where,
            attributes: [
                "id",
                "name",
                "phone_number",
                "email",
                "message",
                "admin_comments",
                "product_id",
            ],
        });

        return resSuccess({ data: noPagination ? result : { pagination, result } });

    } catch (error) {
        throw error
    }
}

export const singleProductInquiry = async (req: Request) => {
    try {
        const { inquiry_id } = req.params;

        const inquiry = await Inquiry.findOne({
            where: {
                id: inquiry_id,
            },
            attributes: [
                "id",
                "name",
                "phone_number",
                "email",
                "message",
                "admin_comments",
                "product_id",
            ],
            include: [
                {
                    model: Diamonds,
                    as: "product",
                    attributes: [
                        "id",
                        "stock_id",
                        "status",
                        [Sequelize.literal(`"product->shape_master"."name"`), "shapeName"],
                        [Sequelize.literal(`"product->shape_master"."id"`), "shapeId"],
                        [Sequelize.literal(`"product->clarity_master"."name"`), "clarityName"],
                        [Sequelize.literal(`"product->clarity_master"."id"`), "clarityId"],
                        [Sequelize.literal(`"product->color_master"."name"`), "colorName"],
                        [Sequelize.literal(`"product->color_master"."id"`), "colorId"],
                        [Sequelize.literal(`"product->color_intensity_master"."name"`), "color_intensityName"],
                        [Sequelize.literal(`"product->color_intensity_master"."id"`), "color_intensityId"],
                        [Sequelize.literal(`"product->lab_master"."name"`), "labName"],
                        [Sequelize.literal(`"product->lab_master"."id"`), "labId"],
                        [Sequelize.literal(`"product->polish_master"."name"`), "polishName"],
                        [Sequelize.literal(`"product->polish_master"."id"`), "polishId"],
                        [Sequelize.literal(`"product->symmetry_master"."name"`), "symmetryName"],
                        [Sequelize.literal(`"product->symmetry_master"."id"`), "symmetryId"],
                        [Sequelize.literal(`"product->fluorescence_master"."name"`), "fluorescenceName"],
                        [Sequelize.literal(`"product->fluorescence_master"."id"`), "fluorescenceId"],
                        [Sequelize.literal(`"product->company_master"."name"`), "companyName"],
                        [Sequelize.literal(`"product->company_master"."id"`), "companyId"],
                        "quantity",
                        "weight",
                        "rate",
                        "report",
                        "video",
                        "image",
                        "certificate",
                        "measurement_height",
                        "measurement_width",
                        "measurement_depth",
                        "table_value",
                        "depth_value",
                        "ratio",
                        "user_comments",
                        "admin_comments",
                        "local_location",
                        "is_active"
                    ],
                    include: [
                        {
                            model: Master,
                            as: "shape_master",
                            attributes: [],
                        },
                        {
                            model: Master,
                            as: "color_master",
                            attributes: [],
                        },
                        {
                            model: Master,
                            as: "color_intensity_master",
                            attributes: [],
                        },
                        {
                            model: Master,
                            as: "clarity_master",
                            attributes: [],
                        },
                        {
                            model: Master,
                            as: "lab_master",
                            attributes: [],
                        },
                        {
                            model: Master,
                            as: "polish_master",
                            attributes: [],
                        },
                        {
                            model: Master,
                            as: "symmetry_master",
                            attributes: [],
                        },
                        {
                            model: Master,
                            as: "fluorescence_master",
                            attributes: [],
                        },
                        {
                            model: Company,
                            as: "company_master",
                            attributes: [],
                        },
                    ]

                }
            ]
        });

        if (!(inquiry && inquiry.dataValues)) {
            throw resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Inquiry"],
                ]),
            });
        }

        return resSuccess({ data: inquiry });
    } catch (error) {
        throw error
    }
}

export const updateSingleProductInquiry = async (req: Request) => {
    try {
        const { inquiry_id } = req.params;
        const { admin_comments } = req.body;

        const inquiry = await Inquiry.findOne({
            where: {
                id: inquiry_id,
            },
        });

        if (!(inquiry && inquiry.dataValues)) {
            throw resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Inquiry"],
                ]),
            });
        }

        await Inquiry.update(
            {
                admin_comments: admin_comments,
            },
            {
                where: {
                    id: inquiry_id,
                },
            }
        );

        return resSuccess({ message: RECORD_UPDATE });

    } catch (error) {
        throw error
    }
}