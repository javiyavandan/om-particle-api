import { Request } from "express";
import Image from "../../model/image.model";
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
import { ADMIN_MAIL, FRONT_END_BASE_URL } from "../../config/env.var";
import { mailAdminDiamondConcierge, mailDiamondConcierge } from "../mail.service";
import Master from "../../model/masters.model";
import Diamonds from "../../model/diamond.model";
import DiamondConcierge from "../../model/diamondConcierge.model";

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

    let productData;
    if (product_id) {
      productData = await Diamonds.findOne({
        where: { id: product_id },
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
    const colorData = await Master.findOne({
      where: {
        id: color,
        master_type: Master_type.Diamond_color,
        is_active: ActiveStatus.Active,
        is_deleted: DeleteStatus.No,
      },
    });
    const clarityData = await Master.findOne({
      where: {
        id: clarity,
        master_type: Master_type.Diamond_clarity,
        is_active: ActiveStatus.Active,
        is_deleted: DeleteStatus.No,
      },
    });
    const shapeData = await Master.findOne({
      where: {
        id: shape,
        master_type: Master_type.Stone_shape,
        is_active: ActiveStatus.Active,
        is_deleted: DeleteStatus.No,
      },
    });

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
      stones: no_of_stones,
      certificate,
      created_at: getLocalDate(),
      created_by: session_res.user_id,
    });

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
        support_email: "purelab@abc.in",
        app_name: "PureLab",
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
        support_email: "purelab@abc.in",
        app_name: "PureLab",
      },
    };

    await mailAdminDiamondConcierge(admin)
    await mailDiamondConcierge(mailPayload);

    return resSuccess();
  } catch (error) {
    throw error;
  }
};
