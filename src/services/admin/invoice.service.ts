import { Request } from "express";
import dbContext from "../../config/dbContext";
import AppUser from "../../model/app_user.model";
import Company from "../../model/companys.model";
import Customer from "../../model/customer.modal";
import Diamonds from "../../model/diamond.model";
import InvoiceDetail from "../../model/invoice-detail.model";
import Invoice from "../../model/invoice.model";
import { DeleteStatus, ActiveStatus, UserVerification, StockStatus, MEMO_STATUS, Master_type } from "../../utils/app-enumeration";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import { resNotFound, prepareMessageFromParams, getLocalDate, resSuccess, resBadRequest, getInitialPaginationFromQuery } from "../../utils/shared-functions";
import Master from "../../model/masters.model";
import { Sequelize, Op } from "sequelize";

export const createInvoice = async (req: Request) => {
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

        const taxFind = await Master.findAll({
            where: {
                master_type: Master_type.Tax,
                country_id: findCompany.dataValues.country_id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            }
        })

        if (!(taxFind && taxFind.length > 0)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Tax for this country was"]])
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
                    stock_price: stock_list[index].rate,
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

        const invoiceList = await Invoice.findAll({
            where: {
                company_id: req.body.session_res.company_id ? req.body.session_res.company_id : company_id,
            }
        })

        const invoiceNumber = invoiceList[invoiceList.length - 1] ? Number(invoiceList[invoiceList.length - 1].dataValues.invoice_number) + 1 : 1;
        try {
            const invoicePayload = {
                invoice_number: invoiceNumber,
                company_id: findCompany.dataValues.id,
                customer_id: findCustomer.dataValues.id,
                created_at: getLocalDate(),
                created_by: req.body.session_res.id,
                remarks,
            };

            const invoiceData = await Invoice.create(invoicePayload, {
                transaction: trn,
            });

            const invoiceId = invoiceData.dataValues.id;

            const stockListWithInvoiceId = stockList.map((stock: any) => ({
                ...stock,
                invoice_id: invoiceId,
            }));

            await InvoiceDetail.bulkCreate(stockListWithInvoiceId, {
                transaction: trn,
            })

            const stockUpdate = allStock.filter(stock => stockList.map((data: any) => data.stock_id).includes(stock.dataValues.id)).map(stock => ({
                ...stock.dataValues,
                status: StockStatus.SOLD
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

export const getInvoice = async (req: Request) => {
    try {
        const { invoice_id } = req.params

        const invoice = await Invoice.findOne({
            where: {
                id: invoice_id,
            },
            attributes: [
                "id",
                "invoice_number",
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
                    model: InvoiceDetail,
                    as: "invoice_details",
                    attributes: [
                        "stock_price",
                        [Sequelize.literal(`"invoice_details->stocks"."id"`), "stock"],
                        [Sequelize.literal(`"invoice_details->stocks"."stock_id"`), "stock_id"],
                        [Sequelize.literal(`"invoice_details->stocks"."status"`), "status"],
                        [Sequelize.literal(`"invoice_details->stocks"."quantity"`), "quantity"],
                        [Sequelize.literal(`"invoice_details->stocks"."weight"`), "weight"],
                        [Sequelize.literal(`"invoice_details->stocks"."report"`), "report"],
                        [Sequelize.literal(`"invoice_details->stocks"."video"`), "video"],
                        [Sequelize.literal(`"invoice_details->stocks"."image"`), "image"],
                        [Sequelize.literal(`"invoice_details->stocks"."certificate"`), "certificate"],
                        [Sequelize.literal(`"invoice_details->stocks"."measurement_height"`), "measurement_height"],
                        [Sequelize.literal(`"invoice_details->stocks"."measurement_width"`), "measurement_width"],
                        [Sequelize.literal(`"invoice_details->stocks"."measurement_depth"`), "measurement_depth"],
                        [Sequelize.literal(`"invoice_details->stocks"."table_value"`), "table_value"],
                        [Sequelize.literal(`"invoice_details->stocks"."depth_value"`), "depth_value"],
                        [Sequelize.literal(`"invoice_details->stocks"."ratio"`), "ratio"],
                        [Sequelize.literal(`"invoice_details->stocks"."user_comments"`), "user_comments"],
                        [Sequelize.literal(`"invoice_details->stocks"."admin_comments"`), "admin_comments"],
                        [Sequelize.literal(`"invoice_details->stocks"."local_location"`), "local_location"],
                        [Sequelize.literal(`"invoice_details->stocks->shape_master"."name"`), "shape"],
                        [Sequelize.literal(`"invoice_details->stocks->clarity_master"."name"`), "clarity"],
                        [Sequelize.literal(`"invoice_details->stocks->color_master"."name"`), "color"],
                        [Sequelize.literal(`"invoice_details->stocks->color_intensity_master"."name"`), "color_intensity"],
                        [Sequelize.literal(`"invoice_details->stocks->lab_master"."name"`), "lab"],
                        [Sequelize.literal(`"invoice_details->stocks->polish_master"."name"`), "polish"],
                        [Sequelize.literal(`"invoice_details->stocks->symmetry_master"."name"`), "symmetry"],
                        [Sequelize.literal(`"invoice_details->stocks->fluorescence_master"."name"`), "fluorescence"],
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

        if (!(invoice && invoice.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Invoice"]])
            })
        }

        const taxData = await Master.findAll({
            where: {
                master_type: Master_type.Tax,
                is_deleted: DeleteStatus.No,
                country_id: invoice.dataValues.company.country_id,
                is_active: ActiveStatus.Active,
            },
            attributes: [
                "id",
                "name",
                "value",
            ]
        })

        invoice.dataValues.taxData = taxData

        let totalItemsPrice = 0;

        for (let index = 0; index < invoice.dataValues.invoice_details.length; index++) {
            const element = invoice.dataValues.invoice_details[index].dataValues;

            totalItemsPrice += ((element.stock_price * element.weight) * element.quantity)
        }

        let totalTaxPrice = 0;

        for (let index = 0; index < invoice.dataValues.taxData.length; index++) {
            const element = invoice.dataValues.taxData[index].dataValues;
            invoice.dataValues.taxData[index].dataValues.tax = ((totalItemsPrice * Number(element.value)) / 100).toFixed(2)
            totalTaxPrice += (totalItemsPrice * Number(element.value)) / 100
        }

        invoice.dataValues.totalTaxPrice = totalTaxPrice.toFixed(2)
        invoice.dataValues.totalItemPrice = totalItemsPrice.toFixed(2)
        invoice.dataValues.totalPrice = (totalItemsPrice + totalTaxPrice).toFixed(2)

        invoice.dataValues.totalDiamond = invoice.dataValues.invoice_details.length

        let totalWeight = 0;

        for (const invoiceDetails in invoice.dataValues.invoice_details) {
            const element = invoice.dataValues.invoice_details[invoiceDetails].dataValues;
            totalWeight += element.weight
        }

        invoice.dataValues.totalWeight = totalWeight.toFixed(2)

        return resSuccess({
            data: invoice,
        })

    } catch (error) {
        throw error
    }
}

export const getAllInvoice = async (req: Request) => {
    try {
        const { query } = req;
        let paginationProps = {};
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text,
        };
        let noPagination = req.query.no_pagination === "1";


        const where = [
            req.body.session_res.id_role == 0 ? {} : { company_id: req.body.session_res.company_id },
            pagination.is_active ? { is_active: pagination.is_active } : {},
            pagination.search_text
                ? {
                    [Op.or]: [
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('invoice_number'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details WHERE invoice_id = "invoices"."id" AND CAST(stock_price AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND CAST(stocks.weight AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND CAST(stocks.report AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND CAST(stocks.measurement_height AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND CAST(stocks.measurement_width AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND CAST(stocks.measurement_depth AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND CAST(stocks.table_value AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND CAST(stocks.depth_value AS CHARACTER VARYING) iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND stocks.ratio iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND stocks.user_comments iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },
                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id WHERE invoice_id = "invoices"."id" AND stocks.admin_comments iLIKE '%${pagination.search_text}%')`),
                                    ">", 0
                                )
                            ]
                        },


                        {
                            [Op.or]: [
                                Sequelize.where(
                                    Sequelize.literal(`(SELECT COUNT(*) FROM invoice_details LEFT JOIN diamonds as stocks ON invoice_details.stock_id = stocks.id LEFT JOIN masters ON masters.id = stocks.shape OR masters.id = stocks.clarity OR masters.id = stocks.color OR masters.id = stocks.color_intensity OR masters.id = stocks.lab OR masters.id = stocks.polish OR masters.id = stocks.symmetry OR masters.id = stocks.fluorescence WHERE invoice_id = "invoices"."id"  AND masters.name iLIKE '%${pagination.search_text}%')`),
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
                model: InvoiceDetail,
                as: "invoice_details",
                attributes: [
                    "stock_price",
                    [Sequelize.literal(`"invoice_details->stocks"."id"`), "stock"],
                    [Sequelize.literal(`"invoice_details->stocks"."stock_id"`), "stock_id"],
                    [Sequelize.literal(`"invoice_details->stocks"."status"`), "status"],
                    [Sequelize.literal(`"invoice_details->stocks"."quantity"`), "quantity"],
                    [Sequelize.literal(`"invoice_details->stocks"."weight"`), "weight"],
                    [Sequelize.literal(`"invoice_details->stocks"."report"`), "report"],
                    [Sequelize.literal(`"invoice_details->stocks"."video"`), "video"],
                    [Sequelize.literal(`"invoice_details->stocks"."image"`), "image"],
                    [Sequelize.literal(`"invoice_details->stocks"."certificate"`), "certificate"],
                    [Sequelize.literal(`"invoice_details->stocks"."measurement_height"`), "measurement_height"],
                    [Sequelize.literal(`"invoice_details->stocks"."measurement_width"`), "measurement_width"],
                    [Sequelize.literal(`"invoice_details->stocks"."measurement_depth"`), "measurement_depth"],
                    [Sequelize.literal(`"invoice_details->stocks"."table_value"`), "table_value"],
                    [Sequelize.literal(`"invoice_details->stocks"."depth_value"`), "depth_value"],
                    [Sequelize.literal(`"invoice_details->stocks"."ratio"`), "ratio"],
                    [Sequelize.literal(`"invoice_details->stocks"."user_comments"`), "user_comments"],
                    [Sequelize.literal(`"invoice_details->stocks"."admin_comments"`), "admin_comments"],
                    [Sequelize.literal(`"invoice_details->stocks"."local_location"`), "local_location"],
                    [Sequelize.literal(`"invoice_details->stocks->shape_master"."name"`), "shape"],
                    [Sequelize.literal(`"invoice_details->stocks->clarity_master"."name"`), "clarity"],
                    [Sequelize.literal(`"invoice_details->stocks->color_master"."name"`), "color"],
                    [Sequelize.literal(`"invoice_details->stocks->color_intensity_master"."name"`), "color_intensity"],
                    [Sequelize.literal(`"invoice_details->stocks->lab_master"."name"`), "lab"],
                    [Sequelize.literal(`"invoice_details->stocks->polish_master"."name"`), "polish"],
                    [Sequelize.literal(`"invoice_details->stocks->symmetry_master"."name"`), "symmetry"],
                    [Sequelize.literal(`"invoice_details->stocks->fluorescence_master"."name"`), "fluorescence"],
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

        if (!noPagination) {
            const totalItems = await Invoice.count({
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

        const result = await Invoice.findAll({
            ...paginationProps,
            where,
            attributes: [
                "id",
                "invoice_number",
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

                for (let i = 0; i < result[index].dataValues.invoice_details.length; i++) {
                    const element = result[index].dataValues.invoice_details[i].dataValues;

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

                result[index].dataValues.totalDiamond = result[index].dataValues.invoice_details.length

                let totalWeight = 0;

                for (const invoiceDetails in result[index].dataValues.invoice_details) {
                    const element = result[index].dataValues.invoice_details[invoiceDetails].dataValues;
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