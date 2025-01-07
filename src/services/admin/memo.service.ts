import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { ActiveStatus, DeleteStatus, Master_type, MEMO_STATUS, StockStatus, UserVerification } from "../../utils/app-enumeration";
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, refreshMaterializedDiamondListView, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
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
        const { company_id, customer_id, stock_list, remarks } = req.body
        const stockError = [];
        const stockList: any = [];

        if (stock_list.length == 0) {
            return resBadRequest({
                message: "Please select stock"
            })
        }

        const findCompany = await Company.findOne({
            where: {
                id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
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
            where: [
                { is_deleted: DeleteStatus.No },
                req.body.session_res.company_id ? { company_id: req.body.session_res.company_id } : {},
                { status: StockStatus.AVAILABLE }
            ]
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
                company_id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
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
                remarks,
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
            await refreshMaterializedDiamondListView()

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
                "created_at",
                "created_by",
                "remarks"
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
                        "registration_number",
                        "address",
                        "city",
                        "state",
                        "country",
                        [Sequelize.literal(`"customer->user"."first_name"`), "first_name"],
                        [Sequelize.literal(`"customer->user"."last_name"`), "last_name"],
                        [Sequelize.literal(`"customer->user"."email"`), "email"],
                        [Sequelize.literal(`"customer->user"."phone_number"`), "phone_number"],
                    ],
                    include: [
                        {
                            model: AppUser,
                            as: "user",
                            required: true,
                            attributes: []
                        }
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
                        "country_id",
                        "ac_holder",
                        "bank_name",
                        "ac_number",
                        "bank_branch",
                        "bank_branch_code",
                        "company_address",
                        "city",
                        "state",
                        "pincode",
                        "phone_number",
                        "email",
                        "map_link"
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
                            where: {
                                is_deleted: DeleteStatus.No,
                            },
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

        const taxData = await Master.findAll({
            where: {
                master_type: Master_type.Tax,
                is_deleted: DeleteStatus.No,
                country_id: memo.dataValues.company.country_id,
                is_active: ActiveStatus.Active,
            },
            attributes: [
                "id",
                "name",
                "value",
            ]
        })

        memo.dataValues.taxData = taxData

        let totalItemsPrice = 0;

        for (let index = 0; index < memo.dataValues.memo_details.length; index++) {
            const element = memo.dataValues.memo_details[index].dataValues;

            totalItemsPrice += ((element.stock_price * element.weight) * element.quantity)
        }

        let totalTaxPrice = 0;

        for (let index = 0; index < memo.dataValues.taxData.length; index++) {
            const element = memo.dataValues.taxData[index].dataValues;
            memo.dataValues.taxData[index].dataValues.tax = ((totalItemsPrice * Number(element.value)) / 100).toFixed(2)
            totalTaxPrice += (totalItemsPrice * Number(element.value)) / 100
        }

        memo.dataValues.totalTaxPrice = totalTaxPrice.toFixed(2)
        memo.dataValues.totalItemPrice = totalItemsPrice.toFixed(2)
        memo.dataValues.totalPrice = (totalItemsPrice + totalTaxPrice).toFixed(2)

        memo.dataValues.totalDiamond = memo.dataValues.memo_details.length

        let totalWeight = 0;

        for (const memoDetails in memo.dataValues.memo_details) {
            const element = memo.dataValues.memo_details[memoDetails].dataValues;
            totalWeight += element.weight
        }

        memo.dataValues.totalWeight = totalWeight.toFixed(2)

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
            req.body.session_res.id_role == 0 ? {} : { company_id: req.body.session_res.company_id },
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
                    "registration_number",
                    "address",
                    "city",
                    "state",
                    "country",
                    [Sequelize.literal(`"customer->user"."first_name"`), "first_name"],
                    [Sequelize.literal(`"customer->user"."last_name"`), "last_name"],
                    [Sequelize.literal(`"customer->user"."email"`), "email"],
                    [Sequelize.literal(`"customer->user"."phone_number"`), "phone_number"],
                ],
                include: [
                    {
                        model: AppUser,
                        as: "user",
                        required: true,
                        attributes: []
                    }
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
                    "country_id",
                    "ac_holder",
                    "bank_name",
                    "ac_number",
                    "bank_branch",
                    "bank_branch_code",
                    "company_address",
                    "city",
                    "state",
                    "pincode",
                    "phone_number",
                    "email",
                    "map_link"
                ]
            },
            {
                model: MemoDetail,
                as: "memo_details",
                where: {
                    is_deleted: DeleteStatus.No,
                },
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
                distinct: true,
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
                "created_at",
                "created_by",
                "remarks"
            ],
            include: includes,
        });

        for (let index = 0; index < result.length; index++) {

            if (result[index].dataValues) {
                const taxData = await Master.findAll({
                    where: {
                        master_type: Master_type.Tax,
                        is_deleted: DeleteStatus.No,
                        country_id: result[index].dataValues.company.country_id,
                        is_active: ActiveStatus.Active,
                    },
                    attributes: [
                        "id",
                        "name",
                        "value",
                    ]
                })

                result[index].dataValues.taxData = taxData;

                let totalItemsPrice = 0;

                for (let i = 0; i < result[index].dataValues.memo_details.length; i++) {
                    const element = result[index].dataValues.memo_details[i].dataValues;

                    totalItemsPrice += ((element.stock_price * element.weight) * element.quantity)
                }

                let totalTaxPrice = 0;

                for (let i = 0; i < result[index].dataValues.taxData.length; i++) {
                    const element = result[index].dataValues.taxData[i].dataValues;
                    result[index].dataValues.taxData[i].dataValues.tax = ((totalItemsPrice * Number(element.value)) / 100).toFixed(2)
                    totalTaxPrice += (totalItemsPrice * Number(element.value)) / 100
                }

                result[index].dataValues.totalTaxPrice = totalTaxPrice.toFixed(2)
                result[index].dataValues.totalItemPrice = totalItemsPrice.toFixed(2)
                result[index].dataValues.totalPrice = (totalItemsPrice + totalTaxPrice).toFixed(2)

                result[index].dataValues.totalDiamond = result[index].dataValues.memo_details.length

                let totalWeight = 0;

                for (const memoDetails in result[index].dataValues.memo_details) {
                    const element = result[index].dataValues.memo_details[memoDetails].dataValues;
                    totalWeight += element.weight
                }

                result[index].dataValues.totalWeight = totalWeight.toFixed(2)
            }

        }

        return resSuccess({ data: noPagination ? result : { pagination, result } });

    } catch (error) {
        throw error;
    }
}

export const returnMemoStock = async (req: Request) => {
    try {
        const { memo_id, stock_list, company_id } = req.body;
        const stockError = [];
        const stockList = [];

        if (stock_list) {
            if (stock_list.length == 0) {
                return resBadRequest({
                    message: "Please select stock"
                })
            }
        }

        const memo = await Memo.findOne({
            where: {
                id: memo_id,
                is_deleted: DeleteStatus.No
            },
            include: [
                {
                    model: MemoDetail,
                    as: 'memo_details',
                }
            ]
        })

        if (!(memo && memo.dataValues)) {
            return resNotFound({ message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Memo"]]) })
        }

        const stockData = stock_list && stock_list.length > 0 ? stock_list : memo.dataValues.memo_details.map((memoData: any) => memoData.dataValues.stock_id)

        const allStock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                company_id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
                status: StockStatus.MEMO
            }
        })

        for (let index = 0; index < stockData.length; index++) {
            const stockId = stockData[index];
            const findStock = allStock.find(stock => stock.dataValues.id == stockId)
            if (!(findStock && findStock.dataValues)) {
                stockError.push(prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", `${stockId} stock`]]))
            } else {
                stockList.push({
                    ...findStock.dataValues,
                    modified_at: getLocalDate(),
                    modified_by: req.body.session_res.id,
                    status: StockStatus.AVAILABLE,
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
        try {
            await Diamonds.bulkCreate(stockList, {
                updateOnDuplicate: ["modified_at", "modified_by", "status"],
                transaction: trn
            });

            if (memo.dataValues.memo_details.length === stockList.length) {
                await Memo.update({
                    status: MEMO_STATUS.Close,
                }, {
                    where: {
                        id: memo.dataValues.id
                    },
                    transaction: trn
                })
            }

            trn.commit();
            await refreshMaterializedDiamondListView()

            return resSuccess()
        } catch (error) {
            trn.rollback();
            throw error
        }

    } catch (error) {
        throw error
    }
}