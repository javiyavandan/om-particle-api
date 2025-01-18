import { Request } from "express";
import {
  getLocalDate,
  prepareMessageFromParams,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import {
  ActiveStatus,
  DeleteStatus,
  IMAGE_TYPE,
  Image_type,
  Master_type,
} from "../../utils/app-enumeration";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ERROR_NOT_FOUND,
} from "../../utils/app-messages";
import { ADMIN_MAIL, APP_NAME, FRONT_END_BASE_URL } from "../../config/env.var";
import { mailAdminDiamondConcierge, mailDiamondConcierge } from "../mail.service";
import Master from "../../model/masters.model";
import Diamonds from "../../model/diamond.model";
import DiamondConcierge from "../../model/diamondConcierge.model";
import { moveFileToS3ByType } from "../../helpers/file-helper";
import Image from "../../model/image.model";
import dbContext from "../../config/dbContext";

export const diamondConciergeForm = async (req: Request) => {
  try {
    const {
      name,
      email,
      measurement,
      message,
      phone_number,
      weight,
      color,
      clarity,
      product_id,
      shape,
      no_of_stones,
      session_res,
      certificate,
    } = req.body;

    const file = req.file;

    let productData;
    if (product_id) {
      productData = await Diamonds.findOne({
        where: { id: product_id, is_deleted: DeleteStatus.No, is_active: ActiveStatus.Active },
      });

      if (!(productData && productData.dataValues)) {
        return resNotFound({
          message: prepareMessageFromParams(ERROR_NOT_FOUND, [
            ["field_name", "Jewelry Product"],
          ]),
          code: DEFAULT_STATUS_CODE_SUCCESS,
        });
      }
    }

    const masterData = await Master.findAll({
      where: {
        is_active: ActiveStatus.Active,
        is_deleted: DeleteStatus.No,
      },
    })

    const colorData = masterData.find((data) => data.dataValues.id == color && data.dataValues.master_type === Master_type.Diamond_color)
    const clarityData = masterData.find((data) => data.dataValues.id == clarity && data.dataValues.master_type === Master_type.Diamond_clarity)
    const shapeData = masterData.find((data) => data.dataValues.id == shape && data.dataValues.master_type === Master_type.Stone_shape);

    if (!(shapeData && shapeData.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Shape"],
        ]),
        code: DEFAULT_STATUS_CODE_SUCCESS,
      });
    }

    if (!(clarityData && clarityData.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Diamond Clarity"],
        ]),
        code: DEFAULT_STATUS_CODE_SUCCESS,
      });
    }

    if (!(colorData && colorData.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Diamond Color"],
        ]),
        code: DEFAULT_STATUS_CODE_SUCCESS,
      });
    }

    const trn = await dbContext.transaction();

    try {

      let id_image;

      if (file) {
        const imageData = await moveFileToS3ByType(
          file,
          Image_type.Concierge
        )

        if (imageData.code !== DEFAULT_STATUS_CODE_SUCCESS) {
          return imageData;
        }
        const imageResult = await Image.create(
          {
            image_path: imageData.data,
            created_at: getLocalDate(),
            created_by: req.body.session_res.id,
            is_deleted: DeleteStatus.No,
            is_active: ActiveStatus.Active,
            image_type: IMAGE_TYPE.Concierge,
          },
          { transaction: trn }
        );

        id_image = imageResult.dataValues.id;

      }

      const conciergeData = await DiamondConcierge.create({
        name: name,
        email: email,
        phone_number: phone_number,
        message: message,
        measurement: measurement,
        weight: weight,
        user_id: session_res.user_id,
        color: colorData.dataValues.id,
        clarity: clarityData.dataValues.id,
        product_id: productData?.dataValues.id,
        shape: shapeData.dataValues.id,
        id_image,
        stones: no_of_stones,
        certificate,
        created_at: getLocalDate(),
        created_by: session_res.user_id,
      },
        { transaction: trn }
      );

      const mailPayload = {
        toEmailAddress: conciergeData.dataValues.email,
        contentTobeReplaced: {
          name: conciergeData.dataValues.name,
          email: conciergeData.dataValues.email,
          phone_number: conciergeData.dataValues.phone_number,
          message: conciergeData.dataValues.message,
          frontend_url: FRONT_END_BASE_URL,
          product_shape: shapeData.dataValues.name,
          product_color: colorData.dataValues.name,
          product_clarity: clarityData.dataValues.name,
          product_stones: no_of_stones,
          product_weight: weight,
          product_measurement: measurement,
          support_email: "ompl@abc.in",
          app_name: APP_NAME,
        },
      };

      const admin = {
        toEmailAddress: ADMIN_MAIL,
        contentTobeReplaced: {
          name: conciergeData.dataValues.name,
          email: conciergeData.dataValues.email,
          phone_number: conciergeData.dataValues.phone_number,
          message: conciergeData.dataValues.message,
          frontend_url: FRONT_END_BASE_URL,
          product_shape: shapeData.dataValues.name,
          product_color: colorData.dataValues.name,
          product_clarity: clarityData.dataValues.name,
          product_stones: no_of_stones,
          product_weight: weight,
          product_measurement: measurement,
          support_email: "ompl@abc.in",
          app_name: APP_NAME,
        },
      };

      await mailAdminDiamondConcierge(admin)
      await mailDiamondConcierge(mailPayload);

      await trn.commit();

      return resSuccess();
    } catch (error) {
      await trn.rollback();
      throw error
    }

  } catch (error) {
    throw error;
  }
};
