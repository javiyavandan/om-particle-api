import { Request } from "express";
import { DUPLICATE_ERROR_CODE, DUPLICATE_VALUE_ERROR_MESSAGE, ERROR_NOT_FOUND, RECORD_DELETED, RECORD_UPDATE } from "../../utils/app-messages";
import { resBadRequest, prepareMessageFromParams, getLocalDate, resSuccess, resNotFound, getInitialPaginationFromQuery, refreshMaterializedDiamondListView } from "../../utils/shared-functions";
import { ActiveStatus, DeleteStatus } from "../../utils/app-enumeration";
import { Op, Sequelize } from "sequelize";
import Company from "../../model/companys.model";
import Country from "../../model/country.model";

export const addCompany = async (req: Request) => {
    try {
        const {
            name,
            registration_number,
            country_id,
            ac_holder,
            bank_name,
            ac_number,
            bank_branch,
            bank_branch_code,
            company_address,
            city,
            state,
            pincode,
            phone_number,
            email,
            map_link,
        } = req.body;

        const findCompany = await Company.findOne({
            where: {
                name: name,
                is_deleted: DeleteStatus.No,
            }
        });

        if (findCompany && findCompany.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DUPLICATE_VALUE_ERROR_MESSAGE, [
                    ["field_name", "Company"],
                ]),
            });
        }

        const company = await Company.create({
            name: name,
            registration_number,
            country_id,
            ac_holder,
            bank_name,
            ac_number,
            bank_branch,
            bank_branch_code,
            company_address,
            city,
            state,
            pincode,
            phone_number,
            email,
            map_link,
            is_deleted: DeleteStatus.No,
            is_active: ActiveStatus.Active,
            created_at: getLocalDate(),
            created_by: req.body.session_res.id,
        });

        refreshMaterializedDiamondListView()

        return resSuccess();

    } catch (error) {
        throw error;
    }
}

export const updateCompany = async (req: Request) => {
    try {
        const { name,
            registration_number,
            country_id,
            ac_holder,
            bank_name,
            ac_number,
            bank_branch,
            bank_branch_code,
            company_address,
            city,
            state,
            pincode,
            map_link,
            phone_number,
            email, } = req.body
        const { company_id } = req.params;

        const company = await Company.findOne({
            where: {
                id: company_id,
                is_deleted: DeleteStatus.No
            }
        })

        if (!(company && company.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Company"],
                ]),
            })
        }

        const duplicateCompany = await Company.findOne({
            where: {
                id: { [Op.ne]: company.dataValues.id },
                name: name,
                is_deleted: DeleteStatus.No,
            }
        });

        if (duplicateCompany && duplicateCompany.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DUPLICATE_VALUE_ERROR_MESSAGE, [
                    ["field_name", "Company"],
                ]),
            });
        }

        await Company.update({
            name: name,
            registration_number,
            country_id,
            ac_holder,
            bank_name,
            ac_number,
            bank_branch,
            bank_branch_code,
            company_address,
            city,
            state,
            pincode,
            phone_number,
            email,
            map_link,
            updated_at: getLocalDate(),
            updated_by: req.body.session_res.id,
        }, {
            where: {
                id: company.dataValues.id
            }
        });

        refreshMaterializedDiamondListView()
        return resSuccess({ message: RECORD_UPDATE });

    } catch (error) {
        throw error;
    }
}

export const deleteCompany = async (req: Request) => {
    try {
        const { company_id } = req.params;
        const company = await Company.findOne({
            where: {
                id: company_id,
                is_deleted: DeleteStatus.No
            }
        });

        if (!(company && company.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", 'Company']])
            })
        }

        await Company.update({
            is_deleted: DeleteStatus.Yes,
            deleted_at: getLocalDate(),
            deleted_by: req.body.session_res.id,
        }, {
            where: {
                id: company.dataValues.id
            }
        });

        refreshMaterializedDiamondListView()

        return resSuccess({ message: RECORD_DELETED });
    } catch (error) {
        throw error;
    }
}


export const getCompanyList = async (req: Request) => {
    try {
        const { query } = req;
        let paginationProps = {};
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text,
            is_deleted: DeleteStatus.No,
        };
        let noPagination = req.query.no_pagination === "1";

        let where = [
            { is_deleted: DeleteStatus.No },
            pagination.is_active ? { is_active: pagination.is_active } : {},
            pagination.search_text
                ? {
                    [Op.or]: [
                        { name: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { registration_number: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { ac_holder: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { bank_name: { [Op.iLike]: `%${pagination.search_text}%` } },
                        {
                            [Op.and]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('ac_number'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        { bank_branch: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { bank_branch_code: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { company_address: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { city: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { state: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { pincode: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { phone_number: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { email: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$country.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                    ],
                }
                : {},
        ];

        if (!noPagination) {
            const totalItems = await Company.count({
                where,
                include: [
                    {
                        model: Country,
                        as: 'country',
                        attributes: [],
                    }
                ]
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

        const result = await Company.findAll({
            order: [[pagination.sort_by, pagination.order_by]],
            ...paginationProps,
            where,
            attributes: ["id", "name", "is_active",
                "registration_number",
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
                "map_link",
                "is_active",
                [Sequelize.literal(`"country"."name"`), 'countryName'],
                [Sequelize.literal(`country.id`), 'countryId']
            ],
            include: [
                {
                    model: Country,
                    as: 'country',
                    attributes: []
                }
            ]
        });

        return resSuccess({ data: noPagination ? result : { pagination, result } });

    } catch (error) {
        throw error;
    }
}


export const getCompany = async (req: Request) => {
    try {
        const { company_id } = req.params;
        const company = await Company.findOne({
            where: {
                id: company_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ["id", "name", "is_active",
                "registration_number",
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
                "map_link",
                [Sequelize.literal(`country.name`), 'countryName'],
                [Sequelize.literal(`country.id`), 'countryId']
            ],
            include: [
                {
                    model: Country,
                    as: 'country',
                    attributes: []
                }
            ]
        });
        if (!(company && company.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", 'Company']])
            })
        }
        return resSuccess({ data: { company } });
    } catch (error) {
        throw error;
    }
}

export const updateCompanyStatus = async (req: Request) => {
    try {
        const { company_id } = req.params;
        const { session_res } = req.body;
        const company = await Company.findOne({
            where: {
                id: company_id,
                is_deleted: DeleteStatus.No
            }
        });
        if (!(company && company.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", 'Company']])
            })
        }
        await Company.update(
            {
                is_active: company.dataValues.is_active === ActiveStatus.Active ? ActiveStatus.InActive : ActiveStatus.Active,
                modified_at: getLocalDate(),
                modified_by: session_res.id
            },
            { where: { id: company.dataValues.id } }
        );
        refreshMaterializedDiamondListView()
        return resSuccess({ message: RECORD_UPDATE });
    } catch (error) {
        throw error;
    }
}