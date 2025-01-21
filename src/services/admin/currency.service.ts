import { Request } from "express"
import Currency from "../../model/currency-master.model"
import { ActiveStatus, DeleteStatus } from "../../utils/app-enumeration"
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions"
import { CURRENCY_DELETE_DEFAULT, CURRENCY_STATUS_DEFAULT, DUPLICATE_ERROR_CODE, DATA_ALREADY_EXITS, ERROR_NOT_FOUND, RECORD_UPDATE, RECORD_DELETED } from "../../utils/app-messages"
import { Op } from "sequelize"
import dbContext from "../../config/dbContext"

export const addCurrency = async (req: Request) => {
    try {
        const { name, code, symbol, format, is_default } = req.body

        const findCurrency = await Currency.findOne({
            where: {
                name: name,
                is_deleted: DeleteStatus.No
            }
        });

        if (findCurrency && findCurrency.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Currency"],
                ]),
            });
        }

        const trn = await dbContext.transaction();
        try {

            if (is_default === ActiveStatus.Active) {
                await Currency.update({
                    is_default: ActiveStatus.InActive,
                }, {
                    where: {
                        is_default: ActiveStatus.Active,
                        is_deleted: DeleteStatus.No
                    },
                    transaction: trn
                });
            }

            await Currency.create({
                name,
                code,
                symbol,
                format,
                is_default,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active,
                created_at: getLocalDate(),
                created_by: req.body.session_res.id,
            },
                { transaction: trn });

            await trn.commit();
            return resSuccess();
        } catch (error) {
            await trn.rollback();
            throw error
        }


    } catch (error) {
        throw error
    }
}

export const updateCurrency = async (req: Request) => {
    try {
        const { currency_id } = req.params
        const { name, code, symbol, format, is_default } = req.body

        const findCurrency = await Currency.findOne({
            where: {
                id: currency_id,
                is_deleted: DeleteStatus.No
            }
        });

        if (!(findCurrency && findCurrency.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Currency"],
                ]),
            })
        }

        const duplicateCurrency = await Currency.findOne({
            where: {
                id: { [Op.ne]: currency_id },
                code: code,
                is_deleted: DeleteStatus.No
            }
        });

        if (duplicateCurrency && duplicateCurrency.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Currency"],
                ]),
            });
        }

        const trn = await dbContext.transaction();
        try {

            if (is_default === ActiveStatus.Active) {
                await Currency.update({
                    is_default: ActiveStatus.InActive,
                }, {
                    where: {
                        is_default: ActiveStatus.Active,
                        is_deleted: DeleteStatus.No
                    },
                    transaction: trn
                });
            }

            await Currency.update({
                name,
                code,
                symbol,
                format,
                is_default,
                modified_at: getLocalDate(),
                modified_by: req.body.session_res.id,
            }, {
                where: {
                    id: currency_id
                },
                transaction: trn
            });
            await trn.commit();
            return resSuccess({ message: RECORD_UPDATE });
        } catch (error) {
            await trn.rollback();
            throw error
        }
    } catch (error) {
        throw error
    }
}

export const deleteCurrency = async (req: Request) => {
    try {
        const { currency_id } = req.params

        const findCurrency = await Currency.findOne({
            where: {
                id: currency_id,
                is_deleted: DeleteStatus.No
            }
        });

        if (!(findCurrency && findCurrency.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Currency"],
                ]),
            })
        }

        if (findCurrency.dataValues.is_default === ActiveStatus.Active) {
            return resBadRequest({
                message: CURRENCY_DELETE_DEFAULT,
            })
        }

        await Currency.update({
            is_deleted: DeleteStatus.Yes,
            deleted_at: getLocalDate(),
            deleted_by: req.body.session_res.id,
        }, {
            where: {
                id: currency_id
            }
        });
        return resSuccess({ message: RECORD_DELETED });
    } catch (error) {
        throw error
    }
}

export const updateCurrencyStatus = async (req: Request) => {
    try {
        const { currency_id } = req.params

        const findCurrency = await Currency.findOne({
            where: {
                id: currency_id,
                is_deleted: DeleteStatus.No
            }
        });

        if (!(findCurrency && findCurrency.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Currency"],
                ]),
            })
        }

        if (findCurrency.dataValues.is_default === ActiveStatus.Active) {
            return resBadRequest({
                message: CURRENCY_STATUS_DEFAULT,
            })
        }

        switch (findCurrency.dataValues.is_active) {
            case ActiveStatus.Active:
                await Currency.update({
                    is_active: ActiveStatus.InActive,
                    modified_at: getLocalDate(),
                    modified_by: req.body.session_res.id,
                }, {
                    where: {
                        id: currency_id
                    }
                })

                return resSuccess({ message: RECORD_UPDATE });

            case ActiveStatus.InActive:
                await Currency.update({
                    is_active: ActiveStatus.Active,
                    modified_at: getLocalDate(),
                    modified_by: req.body.session_res.id,
                }, {
                    where: {
                        id: currency_id
                    }
                })
                return resSuccess({ message: RECORD_UPDATE });

            default:
                break;
        }

    } catch (error) {
        throw error
    }
}

export const getAllCurrency = async (req: Request) => {
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
                        code: { [Op.iLike]: `%${pagination.search_text}%` },
                        formate: { [Op.iLike]: `%${pagination.search_text}%` },
                        symbol: { [Op.iLike]: `%${pagination.search_text}%` },
                    },
                }
                : {},
        ];

        if (!noPagination) {

            const totalItems = await Currency.count({
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


        const result = await Currency.findAll({
            where,
            ...paginationProps,
            order: [[pagination.sort_by, pagination.order_by]],
            attributes: [
                "id",
                "name",
                "code",
                "symbol",
                "format",
                "is_default",
                "is_active",
            ]
        });
        return resSuccess({ data: noPagination ? result : { pagination, result } });
    } catch (error) {
        throw error
    }
}

export const getCurrencyById = async (req: Request) => {
    try {
        const { currency_id } = req.params
        const currency = await Currency.findOne({
            where: {
                id: currency_id,
                is_deleted: DeleteStatus.No
            },
            attributes: [
                "id",
                "name",
                "code",
                "symbol",
                "format",
                "is_default",
                "is_active",
            ]
        });

        if (!(currency && currency.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Currency"],
                ]),
            })
        }

        return resSuccess({ data: currency });

    } catch (error) {
        throw error
    }
}