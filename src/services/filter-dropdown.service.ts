import { Request } from "express";
import Master from "../model/masters.model";
import {
  ActiveStatus,
  DeleteStatus,
  IMAGE_TYPE,
  Master_type,
  UserType,
} from "../utils/app-enumeration";
import { resSuccess } from "../utils/shared-functions";
import Image from "../model/image.model";
import { Sequelize } from "sequelize";
import { IMAGE_URL } from "../config/env.var";
import { FilterOrder } from "../utils/app-constants";
import Company from "../model/companys.model";
import Customer from "../model/customer.modal";
import AppUser from "../model/app_user.model";

export const getAllFilterData = async (req: Request) => {
  const where = () => {
    return {
      is_deleted: DeleteStatus.No,
      is_active: ActiveStatus.Active,
    };
  };

  const masterData = await Master.findAll({
    where: where(),
    order: [[FilterOrder.sort_by, FilterOrder.order_by]],
    attributes: [
      "id",
      "name",
      "slug",
      "value",
      "sort_code",
      "stone_type",
      "master_type",
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
  })

  try {
    const shapeData = masterData.filter((data) => {
      return data.dataValues.master_type === Master_type.Stone_shape;
    });
    const clarityData = masterData.filter((data) => {
      return data.dataValues.master_type === Master_type.Diamond_clarity;
    });
    const colorData = masterData.filter((data) => {
      return data.dataValues.master_type === Master_type.Diamond_color;
    });
    const colorIntensityData = masterData.filter((data) => {
      return data.dataValues.master_type === Master_type.colorIntensity;
    });
    const labData = masterData.filter((data) => {
      return data.dataValues.master_type === Master_type.lab;
    });
    const fluorescenceData = masterData.filter((data) => {
      return data.dataValues.master_type === Master_type.fluorescence;
    });
    const polishData = masterData.filter((data) => {
      return data.dataValues.master_type === Master_type.Polish;
    });
    const symmetryData = masterData.filter((data) => {
      return data.dataValues.master_type === Master_type.symmetry;
    });
    const companyData = await Company.findAll({ where: where(), attributes: ["id", "name"] });
    const customerData = await Customer.findAll({
      attributes: ["id", "company_name"], include: [{
        model: AppUser, as: "user", where: {
          user_type: UserType.Customer,
          ...where()
        }
      }]
    });
    return resSuccess({
      data: {
        shapeData: shapeData,
        clarityData: clarityData,
        colorData: colorData,
        colorIntensityData: colorIntensityData,
        companyData,
        customerData,
        labData,
        fluorescenceData,
        polishData,
        symmetryData,
      },
    });
  } catch (error) {
    throw error;
  }
};
