import { Request } from "express";
import Master from "../../model/masters.model";
import { DeleteStatus, Master_type } from "../../utils/app-enumeration";
import {
  prepareMessageFromParams,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import { Sequelize } from "sequelize";
import Image from "../../model/image.model";
import { DEFAULT_STATUS_CODE_SUCCESS, ERROR_NOT_FOUND } from "../../utils/app-messages";
import { IMAGE_URL } from "../../config/env.var";

export const getParentCategory = async (req: Request) => {
  try {

    const MasterData = await Master.findAll({
      where: {
        master_type: Master_type.Category_master,
        id_parent: null,
        is_deleted: DeleteStatus.No,
      },
      attributes: [
        "id",
        "master_type",
        "name",
        "slug",
        "id_image",
        "is_active",
        "order_by",
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

    return resSuccess({ data: { result: MasterData } });
  } catch (error) {
    throw error;
  }
};

export const getSubCategory = async (req: Request) => {
  try {
    const { id_parent } = req.params;

    const findParentIdData = await Master.findOne({
      where: {
        id: id_parent,
        is_deleted: DeleteStatus.No,
        master_type: Master_type.Category_master,
      },
      attributes: ["id", "master_type", "name", "slug", "id_image"],
    });

    if (!(findParentIdData && findParentIdData.dataValues)) {
      return resNotFound({
        code: DEFAULT_STATUS_CODE_SUCCESS,
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Parent Category"],
        ]),
      });
    }

    const MasterData = await Master.findAll({
      where: {
        master_type: Master_type.Category_master,
        id_parent: id_parent,
        is_deleted: DeleteStatus.No,
      },
      attributes: [
        "id",
        "master_type",
        "name",
        "slug",
        "id_image",
        "id_parent",
        "is_active",
        "order_by",
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

    return resSuccess({ data: { result: MasterData } });
  } catch (error) {
    throw error;
  }
};
