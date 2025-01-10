import { Request } from "express";
import Country from "../../model/country.model";
import { DUPLICATE_ERROR_CODE, DUPLICATE_VALUE_ERROR_MESSAGE, ERROR_NOT_FOUND, RECORD_DELETED, RECORD_UPDATE } from "../../utils/app-messages";
import { resBadRequest, prepareMessageFromParams, getLocalDate, resSuccess, resNotFound, getInitialPaginationFromQuery, refreshMaterializedDiamondListView } from "../../utils/shared-functions";
import { ActiveStatus, DeleteStatus } from "../../utils/app-enumeration";
import { Op } from "sequelize";

export const addCountry = async (req: Request) => {
    try {
        const { name } = req.body;

        const findCountry = await Country.findOne({
            where: {
                name: name,
                is_deleted: DeleteStatus.No
            }
        });

        if (findCountry && findCountry.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DUPLICATE_VALUE_ERROR_MESSAGE, [
                    ["field_name", "Country"],
                ]),
            });
        }

        const country = await Country.create({
            name: name,
            slug: name.toLowerCase().replaceAll(" ", "-"),
            is_deleted: DeleteStatus.No,
            is_active: ActiveStatus.Active,
            created_at: getLocalDate(),
            created_by: req.body.session_res.user_id,
        });


        await refreshMaterializedDiamondListView();
        return resSuccess();

    } catch (error) {
        throw error;
    }
}

export const updateCountry = async (req: Request) => {
    try {
        const { name } = req.body
        const { country_id } = req.params;

        const country = await Country.findOne({
            where: {
                id: country_id,
                is_deleted: DeleteStatus.No
            }
        })

        if (!(country && country.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Country"],
                ]),
            })
        }

        const duplicateCountry = await Country.findOne({
            where: {
                id: { [Op.ne]: country.dataValues.id },
                name: name
            }
        });

        if (duplicateCountry && duplicateCountry.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DUPLICATE_VALUE_ERROR_MESSAGE, [
                    ["field_name", "Country"],
                ]),
            });
        }

        await Country.update({
            name: name,
            slug: name.toLowerCase().replaceAll(" ", "-"),
            updated_at: getLocalDate(),
            updated_by: req.body.session_res.user_id,
        }, {
            where: {
                id: country.dataValues.id
            }
        });

        await refreshMaterializedDiamondListView();
        return resSuccess({ message: RECORD_UPDATE });

    } catch (error) {
        throw error;
    }
}

export const deleteCountry = async (req: Request) => {
    try {
        const { country_id } = req.params;
        const country = await Country.findOne({
            where: {
                id: country_id,
                is_deleted: DeleteStatus.No
            }
        });

        if (!(country && country.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", 'Country']])
            })
        }

        await Country.update({
            is_deleted: DeleteStatus.Yes,
            deleted_at: getLocalDate(),
            deleted_by: req.body.session_res.user_id,
        }, {
            where: {
                id: country.dataValues.id
            }
        });


        await refreshMaterializedDiamondListView();
        return resSuccess({ message: RECORD_DELETED });
    } catch (error) {
        throw error;
    }
}


export const getCountries = async (req: Request) => {
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
                    [Op.or]: {
                        name: { [Op.iLike]: `%${pagination.search_text}%` },
                        slug: { [Op.iLike]: `%${pagination.search_text}%` },
                    },
                }
                : {},
        ];

        if (!noPagination) {

            const totalItems = await Country.count({
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

        const result = await Country.findAll({
            ...paginationProps,
            order: [[pagination.sort_by, pagination.order_by]],
            where,
            attributes: ["id", "name", "slug", "is_active"],
        });

        return resSuccess({ data: noPagination ? result : { pagination, result } });

    } catch (error) {
        throw error;
    }
}


export const getCountry = async (req: Request) => {
    try {
        const { country_id } = req.params;
        const country = await Country.findOne({
            where: { id: country_id, is_deleted: DeleteStatus.No, },
            attributes: ["id", "name", "slug", "is_active"],
        });
        if (!(country && country.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", 'Country']])
            })
        }
        return resSuccess({ data: { country } });
    } catch (error) {
        throw error;
    }
}

export const updateCountryStatus = async (req: Request) => {
    try {
        const { country_id } = req.params;
        const { session_res } = req.body;
        const country = await Country.findOne({
            where: {
                id: country_id,
                is_deleted: DeleteStatus.No
            }
        });
        if (!(country && country.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", 'Country']])
            })
        }
        await Country.update(
            {
                is_active: country.dataValues.is_active === ActiveStatus.Active ? ActiveStatus.InActive : ActiveStatus.Active,
                modified_at: getLocalDate(),
                modified_by: session_res.user_id
            },
            { where: { id: country.dataValues.id } }
        );
        return resSuccess({ message: RECORD_UPDATE });
    } catch (error) {
        throw error;
    }
}