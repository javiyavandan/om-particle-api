import { Request } from "express";
import {
  ActiveStatus,
  DeleteStatus,
} from "../../utils/app-enumeration";
import { Sequelize } from "sequelize";
import Image from "../../model/image.model";
import {
  prepareMessageFromParams,
  resBadRequest,
  resSuccess,
} from "../../utils/shared-functions";
import StaticPage from "../../model/static-page.model";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import HomePage from "../../model/home-page.model";
import { IMAGE_URL } from "../../config/env.var";

export const getAllStaticPages = async (req: Request) => {
  try {
    const staticPages = await StaticPage.findAll({
      where: {
        is_deleted: DeleteStatus.No,
        is_active: ActiveStatus.Active,
      },
      attributes: ["id", "name", "slug", "description"],
    });

    return resSuccess({ data: staticPages });
  } catch (error) {
    throw error;
  }
};

export const getStaticPageDetail = async (req: Request) => {
  try {
    const { slug } = req.params;
    const staticPage = await StaticPage.findOne({
      where: {
        slug: slug,
        is_deleted: DeleteStatus.No,
        is_active: ActiveStatus.Active,
      },
      attributes: ["id", "name", "slug", "description"],
    });

    if (!(staticPage && staticPage.dataValues)) {
      return resBadRequest({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Static Page"],
        ]),
      });
    }

    return resSuccess({ data: staticPage });
  } catch (error) {
    throw error;
  }
};

export const getHomePageData = async () => {
  try {
    const result = await HomePage.findAll({
      order: [["sort_order", "ASC"]],
      where: {
        is_deleted: DeleteStatus.No,
        is_active: ActiveStatus.Active,
      },
      attributes: [
        "id",
        "section_type",
        "title",
        "sub_title",
        "description",
        "button_hover_color",
        "button_color",
        "button_text_color",
        "button_text_hover_color",
        "is_button_transparent",
        "link",
        "sort_order",
        "hash_tag",
        "alignment",
        [
          Sequelize.fn(
            "CONCAT",
            IMAGE_URL,
            Sequelize.literal(`"image"."image_path"`)
          ),
          "image_path",
        ],
        [
          Sequelize.fn(
            "CONCAT",
            IMAGE_URL,
            Sequelize.literal(`"hover_image"."image_path"`)
          ),
          "hover_image_path",
        ],
        "id_diamond_shape"
      ],
      include: [
        {
          model: Image,
          as: "image",
          attributes: [],
        },
        {
          model: Image,
          as: "hover_image",
          attributes: [],
        },
      ],
    });

    return resSuccess({ data: result })
  } catch (error) {
    throw error;
  }
}