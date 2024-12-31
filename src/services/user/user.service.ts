import { Request } from "express";
import ContactUs from "../../model/contact-us.model";
import { resSuccess } from "../../utils/shared-functions";
import { mailContactUs } from "../mail.service";
import Master from "../../model/masters.model";
import {
  ActiveStatus,
  DeleteStatus,
  Master_type,
} from "../../utils/app-enumeration";
import { Sequelize } from "sequelize";
import Image from "../../model/image.model";
import { IMAGE_URL } from "../../config/env.var";
import { FilterOrder } from "../../utils/app-constants";

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

export const getParentPreferences = async (req: Request) => {
  try {
    const preferences = await Master.findAll({
      where: {
        master_type: Master_type.Preference,
        is_active: ActiveStatus.Active,
        is_deleted: DeleteStatus.No,
      },
      order: [[FilterOrder.sort_by, FilterOrder.order_by]],
      attributes: [
        "id",
        "name",
        "slug",
        "id_image",
        "id_parent",
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

    return resSuccess({ data: preferences });
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
