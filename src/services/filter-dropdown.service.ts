import { Request } from "express";
import Master from "../model/masters.model";
import {
  ActiveStatus,
  DeleteStatus,
  IMAGE_TYPE,
  Master_type,
} from "../utils/app-enumeration";
import { resSuccess } from "../utils/shared-functions";
import Image from "../model/image.model";
import { Sequelize } from "sequelize";
import { IMAGE_URL } from "../config/env.var";
import { FilterOrder } from "../utils/app-constants";

export const getAllFilterData = async (req: Request) => {
  const where = (type: string) => {
    return {
      master_type: type,
      is_deleted: DeleteStatus.No,
      is_active: ActiveStatus.Active,
    };
  };

  try {
    const shapeData = await Master.findAll({
      where: where(Master_type.Stone_shape),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: [
        "id",
        "name",
        "slug",
        "value",
        "sort_code",
        "stone_type",
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
          model: Image,
          attributes: [],
          as: "image",
        },
      ],
    });
    const cutData = await Master.findAll({
      where: where(Master_type.Diamond_cut),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: ["id", "name", "slug", "value", "sort_code"],
    });
    const clarityData = await Master.findAll({
      where: where(Master_type.Diamond_clarity),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: ["id", "name", "slug", "value", "sort_code", "stone_type"],
    });
    const colorData = await Master.findAll({
      where: where(Master_type.Diamond_color),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: ["id", "name", "slug", "value", "sort_code", "stone_type"],
    });
    const certificateData = await Master.findAll({
      where: where(Master_type.Diamond_certificate),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: ["id", "name", "slug", "value", "sort_code", "stone_type"],
    });
    const processData = await Master.findAll({
      where: where(Master_type.Diamond_process),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: ["id", "name", "slug", "value", "sort_code", "stone_type"],
    });
    const metalKarat = await Master.findAll({
      where: where(Master_type.Metal_karat),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: ["id", "name", "slug", "value", "sort_code", "stone_type"],
    });
    const metalTone = await Master.findAll({
      where: where(Master_type.Metal_tone),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: [
        "id",
        "name",
        "slug",
        "value",
        "sort_code",
        "stone_type",
        "id_image",
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
          model: Image,
          attributes: [],
          as: "image",
        },
      ],
    });
    const category = await Master.findAll({
      where: where(Master_type.Category_master),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: [
        "id",
        "name",
        "slug",
        "value",
        "sort_code",
        "stone_type",
        "id_parent",
        "id_image",
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
          model: Image,
          attributes: [],
          as: "image",
        },
      ],
    });
    const itemSize = await Master.findAll({
      where: where(Master_type.Item_size),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: ["id", "name", "slug", "value", "sort_code"],
      include: [
        {
          model: Image,
          attributes: [],
          as: "image",
        },
      ],
    });
    const itemLength = await Master.findAll({
      where: where(Master_type.Item_length),
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: ["id", "name", "slug", "value", "sort_code"],
      include: [
        {
          model: Image,
          attributes: [],
          as: "image",
        },
      ],
    });
    return resSuccess({
      data: {
        shapeData: shapeData,
        cutData: cutData,
        clarityData: clarityData,
        colorData: colorData,
        certificateData: certificateData,
        processData: processData,
        metalKarat: metalKarat,
        metalTone: metalTone,
        category: category,
        itemSize: itemSize,
        itemLength: itemLength,
      },
    });
  } catch (error) {
    throw error;
  }
};
