import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { ActiveStatus, DeleteStatus, MEMO_STATUS, StockStatus, UserVerification } from "../../utils/app-enumeration";
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
import { CUSTOMER_NOT_VERIFIED, ERROR_NOT_FOUND } from "../../utils/app-messages";
import dbContext from "../../config/dbContext";
import Company from "../../model/companys.model";
import Memo from "../../model/memo.model";
import MemoDetail from "../../model/memo-detail.model";
import { Op, Sequelize } from "sequelize";
import Customer from "../../model/customer.modal";
import AppUser from "../../model/app_user.model";
import Master from "../../model/masters.model";

export const createMemo = async (req: Request) => {
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
                    stock_original_price: findStock.dataValues.rate,
                    stock_price: stock_list[index].rate,
                    created_at: getLocalDate(),
                    created_by: req.body.session_res.id,
                    is_deleted: DeleteStatus.No,
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

        const memoList = await Memo.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                company_id: company_id,
            }
        })

        const memoNumber = memoList[memoList.length - 1] ? Number(memoList[memoList.length - 1].dataValues.memo_number) + 1 : 1;
        try {
            const memoPayload = {
                memo_number: memoNumber,
                company_id: findCompany.dataValues.id,
                customer_id: findCustomer.dataValues.id,
                status: MEMO_STATUS.Active,
                is_deleted: DeleteStatus.No,
                created_at: getLocalDate(),
                created_by: req.body.session_res.id,
            };

            const memoData = await Memo.create(memoPayload, {
                transaction: trn,
            });

            const memoId = memoData.dataValues.id;

            const stockListWithMemoId = stockList.map((stock: any) => ({
                ...stock,
                memo_id: memoId,
            }));

            await MemoDetail.bulkCreate(stockListWithMemoId, {
                transaction: trn,
            })

            const stockUpdate = allStock.filter(stock => stockList.map((data: any) => data.stock_id).includes(stock.dataValues.id)).map(stock => ({
                ...stock.dataValues,
                status: StockStatus.MEMO
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

export const getMemo = async (req: Request) => {
    try {
        const { memo_id } = req.params

        const memo = await Memo.findOne({
            where: {
                id: memo_id,
                is_deleted: DeleteStatus.No
            },
            attributes: [
                "id",
                "memo_number",
                "status",
            ],
            include: [
                {
                    model: Customer,
                    as: "customer",
                    required: true,
                    attributes: [
                        "id",
                        "company_name",
                        "company_website",
                        "company_email",
                        "registration_number",
                        "address",
                        "city",
                        "state",
                        "country"
                    ]
                },
                {
                    model: Company,
                    as: 'company',
                    required: true,
                    attributes: [
                        "id",
                        "name",
                        "registration_number",
                    ]
                },
                {
                    model: MemoDetail,
                    as: "memo_details",
                    attributes: [
                        "stock_price",
                        [Sequelize.literal(`"memo_details->stocks"."id"`), "stock"],
                        [Sequelize.literal(`"memo_details->stocks"."stock_id"`), "stock_id"],
                        [Sequelize.literal(`"memo_details->stocks"."status"`), "status"],
                        [Sequelize.literal(`"memo_details->stocks"."quantity"`), "quantity"],
                        [Sequelize.literal(`"memo_details->stocks"."weight"`), "weight"],
                        [Sequelize.literal(`"memo_details->stocks"."report"`), "report"],
                        [Sequelize.literal(`"memo_details->stocks"."video"`), "video"],
                        [Sequelize.literal(`"memo_details->stocks"."image"`), "image"],
                        [Sequelize.literal(`"memo_details->stocks"."certificate"`), "certificate"],
                        [Sequelize.literal(`"memo_details->stocks"."measurement_height"`), "measurement_height"],
                        [Sequelize.literal(`"memo_details->stocks"."measurement_width"`), "measurement_width"],
                        [Sequelize.literal(`"memo_details->stocks"."measurement_depth"`), "measurement_depth"],
                        [Sequelize.literal(`"memo_details->stocks"."table_value"`), "table_value"],
                        [Sequelize.literal(`"memo_details->stocks"."depth_value"`), "depth_value"],
                        [Sequelize.literal(`"memo_details->stocks"."ratio"`), "ratio"],
                        [Sequelize.literal(`"memo_details->stocks"."user_comments"`), "user_comments"],
                        [Sequelize.literal(`"memo_details->stocks"."admin_comments"`), "admin_comments"],
                        [Sequelize.literal(`"memo_details->stocks"."local_location"`), "local_location"],
                        [Sequelize.literal(`"memo_details->stocks->shape_master"."name"`), "shape"],
                        [Sequelize.literal(`"memo_details->stocks->clarity_master"."name"`), "clarity"],
                        [Sequelize.literal(`"memo_details->stocks->color_master"."name"`), "color"],
                        [Sequelize.literal(`"memo_details->stocks->color_intensity_master"."name"`), "color_intensity"],
                        [Sequelize.literal(`"memo_details->stocks->lab_master"."name"`), "lab"],
                        [Sequelize.literal(`"memo_details->stocks->polish_master"."name"`), "polish"],
                        [Sequelize.literal(`"memo_details->stocks->symmetry_master"."name"`), "symmetry"],
                        [Sequelize.literal(`"memo_details->stocks->fluorescence_master"."name"`), "fluorescence"],
                    ],
                    include: [
                        {
                            model: Diamonds,
                            as: "stocks",
                            attributes: [],
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
                }
            ]
        })

        if (!(memo && memo.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Memo"]])
            })
        }

        return resSuccess({
            data: memo,
        })

    } catch (error) {
        throw error
    }
}

export const getAllMemo = async (req: Request) => {
    try {
        const { query } = req;
        let paginationProps = {};
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text,
        };
        let noPagination = req.query.no_pagination === "1";


        const where = [
            { is_deleted: DeleteStatus.No },
            pagination.is_active ? { is_active: pagination.is_active } : {},
            pagination.search_text
                ? {
                    [Op.or]: [
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('memo_number'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details WHERE memo_id = "memos"."id" AND CAST(stock_price AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND CAST(stocks.weight AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND CAST(stocks.report AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND CAST(stocks.measurement_height AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND CAST(stocks.measurement_width AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND CAST(stocks.measurement_depth AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND CAST(stocks.table_value AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND CAST(stocks.depth_value AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND stocks.ratio iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND stocks.user_comments iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id WHERE memo_id = "memos"."id" AND stocks.admin_comments iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },


                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM memo_details LEFT JOIN diamonds as stocks ON memo_details.stock_id = stocks.id LEFT JOIN masters ON masters.id = stocks.shape OR masters.id = stocks.clarity OR masters.id = stocks.color OR masters.id = stocks.color_intensity OR masters.id = stocks.lab OR masters.id = stocks.polish OR masters.id = stocks.symmetry OR masters.id = stocks.fluorescence WHERE memo_id = "memos"."id"  AND masters.name iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },

                        { '$customer.company_name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$customer.registration_number$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$company.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$company.registration_number$': { [Op.iLike]: `%${pagination.search_text}%` } },
                    ],
                }
                : {},
        ];

        const includes: any = [
            {
                model: Customer,
                as: "customer",
                required: true,
                attributes: [
                    "id",
                    "company_name",
                    "company_website",
                    "company_email",
                    "registration_number",
                    "address",
                    "city",
                    "state",
                    "country"
                ]
            },
            {
                model: Company,
                as: 'company',
                required: true,
                attributes: [
                    "id",
                    "name",
                    "registration_number",
                ]
            },
            {
                model: MemoDetail,
                as: "memo_details",
                attributes: [
                    "stock_price",
                    [Sequelize.literal(`"memo_details->stocks"."id"`), "stock"],
                    [Sequelize.literal(`"memo_details->stocks"."stock_id"`), "stock_id"],
                    [Sequelize.literal(`"memo_details->stocks"."status"`), "status"],
                    [Sequelize.literal(`"memo_details->stocks"."quantity"`), "quantity"],
                    [Sequelize.literal(`"memo_details->stocks"."weight"`), "weight"],
                    [Sequelize.literal(`"memo_details->stocks"."report"`), "report"],
                    [Sequelize.literal(`"memo_details->stocks"."video"`), "video"],
                    [Sequelize.literal(`"memo_details->stocks"."image"`), "image"],
                    [Sequelize.literal(`"memo_details->stocks"."certificate"`), "certificate"],
                    [Sequelize.literal(`"memo_details->stocks"."measurement_height"`), "measurement_height"],
                    [Sequelize.literal(`"memo_details->stocks"."measurement_width"`), "measurement_width"],
                    [Sequelize.literal(`"memo_details->stocks"."measurement_depth"`), "measurement_depth"],
                    [Sequelize.literal(`"memo_details->stocks"."table_value"`), "table_value"],
                    [Sequelize.literal(`"memo_details->stocks"."depth_value"`), "depth_value"],
                    [Sequelize.literal(`"memo_details->stocks"."ratio"`), "ratio"],
                    [Sequelize.literal(`"memo_details->stocks"."user_comments"`), "user_comments"],
                    [Sequelize.literal(`"memo_details->stocks"."admin_comments"`), "admin_comments"],
                    [Sequelize.literal(`"memo_details->stocks"."local_location"`), "local_location"],
                    [Sequelize.literal(`"memo_details->stocks->shape_master"."name"`), "shape"],
                    [Sequelize.literal(`"memo_details->stocks->clarity_master"."name"`), "clarity"],
                    [Sequelize.literal(`"memo_details->stocks->color_master"."name"`), "color"],
                    [Sequelize.literal(`"memo_details->stocks->color_intensity_master"."name"`), "color_intensity"],
                    [Sequelize.literal(`"memo_details->stocks->lab_master"."name"`), "lab"],
                    [Sequelize.literal(`"memo_details->stocks->polish_master"."name"`), "polish"],
                    [Sequelize.literal(`"memo_details->stocks->symmetry_master"."name"`), "symmetry"],
                    [Sequelize.literal(`"memo_details->stocks->fluorescence_master"."name"`), "fluorescence"],
                ],
                include: [
                    {
                        model: Diamonds,
                        as: "stocks",
                        attributes: [],
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
            }
        ]

        if (!noPagination) {
            const totalItems = await Memo.count({
                where,
                include: includes,
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

        const result = await Memo.findAll({
            ...paginationProps,
            where,
            attributes: [
                "id",
                "memo_number",
                "status",
            ],
            include: includes,
        });

        return resSuccess({ data: noPagination ? result : { pagination, result } });

    } catch (error) {
        throw error;
    }
}

export const returnMemoStock = async (req: Request) => {
    try {
        const { stock_list, company_id } = req.body;
        const stockError = [];
        const stockList = [];

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                company_id: company_id,
                status: StockStatus.MEMO
            }
        })

        for (let index = 0; index < stock_list.length; index++) {
            const stockId = stock_list[index].stock_id;
            const findStock = allStock.find(stock => stock.dataValues.stock_id === stockId)
            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else {
                stockList.push({
                    id: findStock.dataValues.id,
                    modified_at: getLocalDate(),
                    modified_by: req.body.session_res.id,
                    status: StockStatus.AVAILABLE,
                    is_deleted: DeleteStatus.No,
                })
            }
        }

        if (stockError.length > 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]]),
                data: stockError.map(err => err)
            })
        }



    } catch (error) {
        throw error
    }
}