import { Request } from "express";
import ContactUs from "../../model/contact-us.model";
import { prepareMessageFromParams, resNotFound, resSuccess } from "../../utils/shared-functions";
import { mailContactUs } from "../mail.service";
import Master from "../../model/masters.model";
import {
  ActiveStatus,
  DeleteStatus,
  Master_type,
} from "../../utils/app-enumeration";
import Currency from "../../model/currency-master.model";
import { Op, Sequelize } from "sequelize";
import BlogCategory from "../../model/blog-category.model";
import Blogs from "../../model/blogs.model";
import Image from "../../model/image.model";
import { IMAGE_URL } from "../../config/env.var";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";

export const contactUs = async (req: Request) => {
  try {
    const { name, email, phone_number, message } = req.body;

    const contactData = await ContactUs.create({
      name: name,
      email: email,
      phone_number: phone_number,
      message: message,
      is_active: 1,
      is_deleted: 0,
      created_at: new Date(),
    });

    const mailPayload = {
      toEmailAddress: contactData?.dataValues.email,
      contentTobeReplaced: {
        name: contactData.dataValues.name,
        email: contactData.dataValues.email,
        phone_number: contactData.dataValues.phone_number,
        message: contactData.dataValues.message,
      },
    };

    await mailContactUs(mailPayload);

    return resSuccess();
  } catch (error) {
    throw error;
  }
};
export const getTax = async (req: Request) => {
  try {
    const taxList = await Master.findAll({
      where: {
        master_type: Master_type.Tax,
        is_deleted: DeleteStatus.No,
        is_active: ActiveStatus.Active,
      },
      attributes: ["id", "name", "value"],
    });

    return resSuccess({ data: taxList });
  } catch (error) {
    throw error;
  }
};

export const getCurrency = async () => {
  try {
    const currency = await Currency.findAll({
      where: {
        is_deleted: DeleteStatus.No,
        is_active: ActiveStatus.Active,
      },
      attributes: ["id", "name", "code", "symbol", "format"],
    })

    return resSuccess({ data: currency });

  } catch (error) {
    throw error;
  }
}

export const getAllBlogs = async (req: Request) => {
  try {
    const { search_text } = req.query;

    const where = [
      { is_deleted: DeleteStatus.No },
      { is_active: ActiveStatus.Active },
      search_text
        ? {
          [Op.or]: [
            { "blogs.title": { [Op.iLike]: `%${search_text}%` } },
            { "blogs.description": { [Op.iLike]: `%${search_text}%` } },
            { "blogs.sort_description": { [Op.iLike]: `%${search_text}%` } },
            { "blogs.author": { [Op.iLike]: `%${search_text}%` } },
          ],
        }
        : {},
    ];

    const result = await BlogCategory.findAll({
      order: [["sort_order", "ASC"]],
      where: where,
      attributes: ["id", "name", "slug"],
      include: [
        {
          model: Blogs,
          as: "blogs",
          where: {
            is_deleted: DeleteStatus.No,
            is_active: ActiveStatus.Active
          },
          order: [["sort_order", "ASC"]],
          attributes: [
            "id",
            "slug",
            "title",
            "description",
            "sort_description",
            "author",
            "created_at",
            "sort_order",
            "id_image",
            "id_banner_image",
            [
              Sequelize.fn("CONCAT", IMAGE_URL, Sequelize.literal(`"blogs->image"."image_path"`)),
              "image_path",
            ],
            [
              Sequelize.fn("CONCAT", IMAGE_URL, Sequelize.literal(`"blogs->banner"."image_path"`)),
              "banner_path",
            ],
          ],
          include: [
            {
              model: Image,
              as: "image",
              attributes: [],
            },
            {
              model: Image,
              as: "banner",
              attributes: [],
            },
          ]
        }
      ]
    })

    return resSuccess({ data: result });

  } catch (error) {
    throw error;
  }
}

export const getBlogDetail = async (req: Request) => {
  try {
    const { slug } = req.params

    const findBlog = await Blogs.findOne({
      where: {
        slug: slug,
        is_deleted: DeleteStatus.No,
        is_active: ActiveStatus.Active
      },
      attributes: [
        "id",
        "slug",
        "title",
        "description",
        "sort_description",
        "meta_title",
        "meta_description",
        "meta_keywords",
        "author",
        "created_at",
        "sort_order",
        "id_image",
        "id_banner_image",
        "id_category",
        [Sequelize.literal(`"category"."name"`), "category_name"],
        [
          Sequelize.fn("CONCAT", IMAGE_URL, Sequelize.literal(`"image"."image_path"`)),
          "image_path",
        ],
        [
          Sequelize.fn("CONCAT", IMAGE_URL, Sequelize.literal(`"banner"."image_path"`)),
          "banner_path",
        ],
      ],
      include: [
        {
          model: BlogCategory,
          as: "category",
          attributes: [],
        },
        {
          model: Image,
          as: "image",
          attributes: [],
        },
        {
          model: Image,
          as: "banner",
          attributes: [],
        },
      ]
    })

    if (!(findBlog && findBlog?.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Blog"]])
      });
    }

    return resSuccess({ data: findBlog });

  } catch (error) {
    throw error;
  }
}