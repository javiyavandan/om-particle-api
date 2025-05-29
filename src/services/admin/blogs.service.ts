import e, { Request } from "express"
import dbContext from "../../config/dbContext"
import { ActiveStatus, DeleteStatus, IMAGE_TYPE, Image_type } from "../../utils/app-enumeration"
import { DATA_ALREADY_EXITS, DEFAULT_STATUS_CODE_SUCCESS, DUPLICATE_ERROR_CODE, ERROR_NOT_FOUND } from "../../utils/app-messages"
import { moveFileToS3ByType } from "../../helpers/file-helper"
import Image from "../../model/image.model"
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions"
import Blogs from "../../model/blogs.model"
import { generateSlug, statusUpdateValue } from "../../helpers/helper"
import BlogCategory from "../../model/blog-category.model"
import { Op, Sequelize } from "sequelize"
import { IMAGE_URL } from "../../config/env.var"

export const addBlog = async (req: Request) => {
    let trn;
    try {
        const {
            title,
            description,
            sort_description,
            meta_title = title,
            meta_description = sort_description,
            meta_keywords,
            author,
            id_category,
            sort_order,
            session_res
        } = req.body
        const files = req.files as { [fieldname: string]: Express.Multer.File[] }

        const slug = generateSlug(title);

        const findBlog = await Blogs.findOne({
            where: {
                slug: slug,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        });

        if (findBlog && findBlog.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Blog"],
                ]),
            });
        }

        if (id_category) {
            const category = await BlogCategory.findOne({
                where: {
                    id: id_category,
                    is_deleted: DeleteStatus.No
                },
                attributes: ['id']
            })

            if (!(category && category.dataValues)) {
                return resNotFound({
                    message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                        ["field_name", "Category"],
                    ]),
                })
            }
        }

        trn = await dbContext.transaction();

        let id_image;
        if (files["image"]) {
            const imageFile: Express.Multer.File = files["image"][0];
            const imageData = await moveFileToS3ByType(
                imageFile,
                Image_type.Blog,
            )
            if (imageData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                return imageData;
            }
            const imagePath = imageData.data
            const image = await Image.create({
                image_path: imagePath,
                created_at: getLocalDate(),
                created_by: session_res.id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active,
                image_type: IMAGE_TYPE.Blog,
            }, {
                transaction: trn
            });

            id_image = image.dataValues.id;
        } else {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Image"],
                ]),
            })
        }

        let id_banner_image
        if (files["banner"]) {
            const imageFile: Express.Multer.File = files["banner"][0];
            const imageData = await moveFileToS3ByType(
                imageFile,
                Image_type.Blog,
            )
            if (imageData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                return imageData;
            }
            const imagePath = imageData.data
            const image = await Image.create({
                image_path: imagePath,
                created_at: getLocalDate(),
                created_by: session_res.id,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active,
                image_type: IMAGE_TYPE.Blog,
            }, {
                transaction: trn
            });

            id_banner_image = image.dataValues.id;
        } else {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Banner Image"],
                ]),
            })
        }

        const blog = await Blogs.create({
            title,
            description,
            sort_description,
            meta_title,
            meta_description,
            meta_keywords,
            author,
            id_image,
            id_banner_image,
            id_category,
            sort_order,
            slug,
            created_at: getLocalDate(),
            created_by: session_res.id,
            is_active: ActiveStatus.Active,
            is_deleted: DeleteStatus.No,
        }, {
            transaction: trn
        });

        await trn.commit();
        return resSuccess({
            message: "Blog added successfully",
            data: blog
        })

    } catch (error) {
        if (trn) {
            await trn.rollback();
        }
        throw error
    }
}

export const updateBlog = async (req: Request) => {
    let trn;
    try {

        const {
            title,
            description,
            sort_description,
            meta_title = title,
            meta_description = sort_description,
            meta_keywords,
            author,
            id_category,
            sort_order,
            image_id = null,
            banner_id = null,
            session_res
        } = req.body
        const { blog_id } = req.params
        const slug = generateSlug(title);
        const files = req.files as { [fieldname: string]: Express.Multer.File[] }

        const findBlog = await Blogs.findOne({
            where: {
                id: blog_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        })

        if (!(findBlog && findBlog.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Blog"],
                ]),
            });
        }

        if (id_category) {
            const category = await BlogCategory.findOne({
                where: {
                    id: id_category,
                    is_deleted: DeleteStatus.No
                },
                attributes: ['id']
            })

            if (!(category && category.dataValues)) {
                return resNotFound({
                    message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                        ["field_name", "Category"],
                    ]),
                })
            }
        }

        const findDuplicate = await Blogs.findOne({
            where: {
                id: { [Op.ne]: blog_id },
                slug,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        })

        if (findDuplicate && findDuplicate.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
                    ["field_name", "Blog"],
                ]),
            });
        }

        trn = await dbContext.transaction();

        let id_image
        if (image_id) {
            id_image = image_id
        } else {
            if (files["image"]) {
                const imageFile: Express.Multer.File = files["image"][0];
                const imageData = await moveFileToS3ByType(
                    imageFile,
                    Image_type.Blog,
                )
                if (imageData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                    return imageData;
                }
                const imagePath = imageData.data
                const image = await Image.create({
                    image_path: imagePath,
                    created_at: getLocalDate(),
                    created_by: session_res.id,
                    is_deleted: DeleteStatus.No,
                    is_active: ActiveStatus.Active,
                    image_type: IMAGE_TYPE.Blog,
                }, {
                    transaction: trn
                });

                id_image = image.dataValues.id;
            } else {
                return resNotFound({
                    message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                        ["field_name", "Image"],
                    ]),
                })
            }
        }

        let id_banner_image
        if (banner_id) {
            id_banner_image = banner_id
        } else {
            if (files["banner"]) {
                const bannerFile: Express.Multer.File = files["banner"][0];
                const bannerData = await moveFileToS3ByType(
                    bannerFile,
                    Image_type.Blog,
                )
                if (bannerData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
                    return bannerData;
                }
                const bannerPath = bannerData.data
                const banner = await Image.create({
                    image_path: bannerPath,
                    created_at: getLocalDate(),
                    created_by: session_res.id,
                    is_deleted: DeleteStatus.No,
                    is_active: ActiveStatus.Active,
                    image_type: IMAGE_TYPE.Blog,
                }, {
                    transaction: trn
                });

                id_banner_image = banner.dataValues.id;
            } else {
                return resNotFound({
                    message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                        ["field_name", "Banner Image"],
                    ]),
                })
            }
        }

        await Blogs.update({
            title,
            description,
            sort_description,
            meta_title,
            meta_description,
            meta_keywords,
            author,
            id_image,
            id_banner_image,
            id_category,
            sort_order,
            slug,
            modified_at: getLocalDate(),
            modified_by: session_res.id,
            is_active: ActiveStatus.Active,
            is_deleted: DeleteStatus.No,
        }, {
            where: { id: blog_id },
            transaction: trn
        });

        await trn.commit();
        return resSuccess({
            message: "Blog updated successfully",
        })

    } catch (error) {
        if (trn) {
            await trn.rollback();
        }
        throw error
    }
}

export const deleteBlog = async (req: Request) => {
    try {
        const { blog_id } = req.params;
        const blog = await Blogs.findOne({
            where: {
                id: blog_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id']
        })

        if (!(blog && blog.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Blog"],
                ]),
            });
        }

        await Blogs.update({
            is_deleted: DeleteStatus.Yes,
            deleted_at: getLocalDate(),
            deleted_by: req.body.session_res.id,
        }, {
            where: { id: blog_id }
        });
        return resSuccess({
            message: "Blog deleted successfully",
        })
    } catch (error) {
        throw error
    }
}

export const updateBlogStatus = async (req: Request) => {
    try {
        const { blog_id } = req.params;
        const blog = await Blogs.findOne({
            where: {
                id: blog_id,
                is_deleted: DeleteStatus.No
            },
            attributes: ['id', 'is_active']
        })

        if (!(blog && blog.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [
                    ["field_name", "Blog"],
                ]),
            });
        }

        await Blogs.update({
            is_active: statusUpdateValue(blog),
            modified_at: getLocalDate(),
            modified_by: req.body.session_res.id,
        }, {
            where: { id: blog_id }
        });
        return resSuccess({
            message: "Blog status updated successfully",
        })
    } catch (error) {
        throw error
    }
}

export const blogList = async (req: Request) => {
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
                        { title: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { description: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { sort_description: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { author: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { slug: { [Op.iLike]: `%${pagination.search_text}%` } },
                    ],
                }
                : {},
        ];

        if (!noPagination) {
            const totalItems = await Blogs.count({
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

        const result = await Blogs.findAll({
            order: [[pagination.sort_by, pagination.order_by]],
            ...paginationProps,
            where,
            attributes: [
                "id",
                "title",
                "description",
                "sort_description",
                "meta_title",
                "meta_description",
                "meta_keywords",
                "author",
                "sort_order",
                "slug",
                "id_image",
                "id_banner_image",
                "id_category",
                "created_at",
                [Sequelize.literal(`"category"."name"`), "category_name"],
                [Sequelize.fn("CONCAT", IMAGE_URL, Sequelize.literal(`"image"."image_path"`)), "image_path"],
                [Sequelize.fn("CONCAT", IMAGE_URL, Sequelize.literal(`"banner"."image_path"`)), "banner_path"],
            ],
            include: [
                {
                    model: BlogCategory,
                    as: "category",
                    attributes: [],
                },
                {
                    model: Image,
                    as: 'image',
                    attributes: [],
                },
                {
                    model: Image,
                    as: 'banner',
                    attributes: [],
                }
            ]
        });

        return resSuccess({
            data: noPagination ? result : { pagination, result } 
        })
    } catch (error) {
        throw error
    }
}

export const blogDetails = async (req: Request) => {
    try {
        const { blog_id } = req.params;

        const blogData = await Blogs.findOne({
            where: {
                id: blog_id,
                is_deleted: DeleteStatus.No
            },
            attributes: [
                "id",
                "title",
                "description",
                "sort_description",
                "meta_title",
                "meta_description",
                "meta_keywords",
                "author",
                "sort_order",
                "slug",
                "id_image",
                "id_banner_image",
                "id_category",
                "created_at",
                [Sequelize.literal(`"category"."name"`), "category_name"],
                [Sequelize.fn("CONCAT", IMAGE_URL, Sequelize.literal(`"image"."image_path"`)), "image_path"],
                [Sequelize.fn("CONCAT", IMAGE_URL, Sequelize.literal(`"banner"."image_path"`)), "banner_path"],
            ],
            include: [
                {
                    model: BlogCategory,
                    as: "category",
                    attributes: [],
                },
                {
                    model: Image,
                    as: 'image',
                    attributes: [],
                },
                {
                    model: Image,
                    as: 'banner',
                    attributes: [],
                }
            ]
        });

        if (!blogData) {
            return resNotFound({
                message: "Blog not found"
            })
        }

        return resSuccess({
            message: "Blog details",
            data: blogData
        })
    } catch (error) {
        throw error
    }
}