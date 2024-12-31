import { Request } from "express";
import Master from "../../model/masters.model";
import { DeleteStatus, Master_type } from "../../utils/app-enumeration";
import {
  getInitialPaginationFromQuery,
  resSuccess,
} from "../../utils/shared-functions";
import { Op, Sequelize } from "sequelize";
import Image from "../../model/image.model";
import { IMAGE_URL } from "../../config/env.var";

export const getPreferenceParentCategory = async (req: Request) => {
  try {
    const { query } = req;
    let pagination = {
      ...getInitialPaginationFromQuery(query),
      search_text: query.search_text,
    };

    let where = [
      { is_deleted: DeleteStatus.No },
      { master_type: Master_type.Preference },
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

    const totalItems = await Master.count({
      where,
    });

    if (totalItems === 0) {
      return resSuccess({ data: { pagination, result: [] } });
    }

    pagination.total_items = totalItems;
    pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

    const MasterData = await Master.findAll({
      where,
      limit: pagination.per_page_rows,
      offset: (pagination.current_page - 1) * pagination.per_page_rows,
      order: [[pagination.sort_by, pagination.order_by]],
      attributes: [
        "id",
        "master_type",
        "name",
        "slug",
        "id_image",
        "id_parent",
        "is_active",
        "link",
        [
          Sequelize.fn(
            "CONCAT",
            IMAGE_URL,
            Sequelize.literal(`"image"."image_path"`)
          ),
          "image_path",
        ],
      ],
      include: [
        {
          required: false,
          model: Image,
          attributes: [],
          as: "image",
        },
      ],
    });

    return resSuccess({ data: { pagination, result: MasterData } });
  } catch (error) {
    throw error;
  }
};
