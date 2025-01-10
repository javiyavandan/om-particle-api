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
import Currency from "../../model/currency-master.model";

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