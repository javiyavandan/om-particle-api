import { Request } from "express";
import BlogCategory from "../../model/blog-category.model";
import { ActiveStatus, DeleteStatus } from "../../utils/app-enumeration";
import { DUPLICATE_ERROR_CODE, DATA_ALREADY_EXITS, ERROR_NOT_FOUND } from "../../utils/app-messages";
import { resBadRequest, prepareMessageFromParams, getLocalDate, resSuccess, resNotFound, getInitialPaginationFromQuery } from "../../utils/shared-functions";
import { Op } from "sequelize";
import Blogs from "../../model/blogs.model";
import { generateSlug } from "../../helpers/helper";

export const addCategory = async (req: Request) => {
    try {
        const { name, sort_order, session_res } = req.body;
        const slug = generateSlug(name);

        const findCategory = await BlogCategory.findOne({
            where: {
                slug: slug,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        });

        if (findCategory && findCategory.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Category"],
                ]),
            });
        }

        const category = await BlogCategory.create({
            name: name,
            slug: slug,
            sort_order: sort_order,
            created_at: getLocalDate(),
            created_by: session_res.id,
        });

        return resSuccess({ data: category });

    } catch (error) {
        throw error
    }
};

export const updateCategory = async (req: Request) => {
    try {
        const { category_id } = req.params
        const { name, sort_order, session_res } = req.body;
        const slug = generateSlug(name);

        const findCategory = await BlogCategory.findOne({
            where: {
                id: category_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        });

        if (!(findCategory && findCategory.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Category"],
                ]),
            });
        }

        const duplicateCategory = await BlogCategory.findOne({
            where: {
                id: { [Op.ne]: category_id },
                slug: slug,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        });

        if (duplicateCategory && duplicateCategory.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Category"],
                ]),
            });
        }

        const category = await BlogCategory.update({
            name: name,
            slug: slug,
            sort_order: sort_order,
            modified_at: getLocalDate(),
            modified_by: session_res.id,
        }, {
            where: {
                id: category_id
            }
        });

        return resSuccess({ data: category });

    } catch (error) {
        throw error
    }
}

export const deleteCategory = async (req: Request) => {
    try {
        const { category_id } = req.params

        const findCategory = await BlogCategory.findOne({
            where: {
                id: category_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        })

        if (!(findCategory && findCategory.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Category"],
                ]),
            });
        }

        const findBlogs = await Blogs.findAll({
            where: {
                id_category: category_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        })

        if (findBlogs?.length > 0) {
            await Blogs.update({
                is_deleted: DeleteStatus.Yes,
                deleted_at: getLocalDate(),
                deleted_by: req.body.session_res.id,
            }, {
                where: {
                    id_category: category_id,
                    is_deleted: DeleteStatus.No
                }
            })
        }

        await BlogCategory.update({
            is_deleted: DeleteStatus.Yes,
            deleted_at: getLocalDate(),
            deleted_by: req.body.session_res.id,
        }, {
            where: {
                id: category_id
            }
        });

        return resSuccess({ message: "Blog Category deleted successfully with it's connected blogs" });
    } catch (error) {
        throw error
    }
}

export const updateCategoryStatus = async (req: Request) => {
    try {
        const { category_id } = req.params
        const { session_res } = req.body;

        const findCategory = await BlogCategory.findOne({
            where: {
                id: category_id,
                is_deleted: DeleteStatus.No
            }
        })

        if (!(findCategory && findCategory.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Category"],
                ]),
            });
        }

        const status = findCategory.dataValues.is_active === ActiveStatus.Active
            ? ActiveStatus.InActive
            : ActiveStatus.Active

        const findBlogs = await Blogs.findAll({
            where: {
                id_category: category_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        })

        if (findBlogs?.length > 0) {
            await Blogs.update({
                is_active: status,
                modified_at: getLocalDate(),
                modified_by: session_res.id,
            }, {
                where: {
                    id_category: category_id,
                    is_deleted: DeleteStatus.No
                }
            })
        }

        const category = await BlogCategory.update({
            is_active: status,
            modified_at: getLocalDate(),
            modified_by: session_res.id
        }, {
            where: {
                id: category_id
            }
        });
        return resSuccess({ data: category });
    } catch (error) {
        throw error
    }
}

export const getCategoryList = async (req: Request) => {
    try {
        const { query } = req;
        let paginationProps = {};
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text,
            is_deleted: DeleteStatus.No,
        };
        let noPagination = req.query.no_pagination === "1";

        const where = [
            { is_deleted: DeleteStatus.No },
            pagination.is_active ? { is_active: pagination.is_active } : {},
            pagination.search_text
                ? {
                    [Op.or]: [
                        { name: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { slug: { [Op.iLike]: `%${pagination.search_text}%` } },
                    ],
                }
                : {},
        ];

        if (!noPagination) {
            const totalItems = await BlogCategory.count({
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

        const result = await BlogCategory.findAll({
            order: [[pagination.sort_by, pagination.order_by]],
            ...paginationProps,
            where,
            attributes: [
                'id',
                'name',
                'slug',
                'sort_order',
                'is_active'
            ]
        });

        return resSuccess({ data: noPagination ? result : { pagination, result } });
    } catch (error) {
        throw error
    }
}

export const getCategoryDetails = async (req: Request) => {
    try {
        const { category_id } = req.params

        const findCategory = await BlogCategory.findOne({
            where: {
                id: category_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id', 'name', 'slug', 'sort_order', 'is_active']
        })

        if (!(findCategory && findCategory.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Category"],
                ]),
            });
        }

        return resSuccess({ data: findCategory });
    } catch (error) {
        throw error
    }
}