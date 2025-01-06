import { Request } from "express";
import Address from "../../model/address.model";
import {
  getLocalDate,
  prepareMessageFromParams,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import {
  DefaultStatus,
  DeleteStatus,
} from "../../utils/app-enumeration";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ERROR_NOT_FOUND,
  RECORD_DELETED,
} from "../../utils/app-messages";

export const addAddress = async (req: Request) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      address,
      city,
      state,
      country,
      postcode,
      is_default,
      session_res,
    } = req.body;

    const addressData = await Address.findAll({
      where: {
        user_id: session_res.user_id,
        is_deleted: DeleteStatus.No,
      },
    });

    await Address.create({
      user_id: session_res.user_id,
      first_name,
      last_name,
      phone_number,
      address,
      city,
      state,
      country,
      postcode,
      created_at: getLocalDate(),
      created_by: session_res.user_id,
      is_deleted: DeleteStatus.No,
      is_default:
        addressData.length > 1 ? DefaultStatus.False : DefaultStatus.True,
    });
    return resSuccess();
  } catch (error) {
    throw error;
  }
};

export const updateAddress = async (req: Request) => {
  try {
    const { address_id } = req.params;
    const {
      first_name,
      last_name,
      phone_number,
      address,
      city,
      state,
      country,
      postcode,
      session_res,
      is_default,
    } = req.body;

    const addressData = await Address.findOne({
      where: {
        id: address_id,
        is_deleted: DeleteStatus.No,
      },
    });

    if (!(addressData && addressData.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Address"],
        ]),
      });
    }

    if (is_default === true) {
      await Address.update(
        {
          is_default: DefaultStatus.False,
        },
        {
          where: {
            user_id: session_res.user_id,
            is_default: DefaultStatus.True,
            is_deleted: DeleteStatus.No,
          },
        }
      );
    }

    await Address.update(
      {
        first_name,
        last_name,
        phone_number,
        address,
        city,
        state,
        country,
        postcode,
        is_default: is_default ? DefaultStatus.True : DefaultStatus.False,
        modified_at: getLocalDate(),
        modified_by: session_res.user_id,
      },
      {
        where: {
          id: address_id,
          is_deleted: DeleteStatus.No,
        },
      }
    );

    return resSuccess();
  } catch (error) {
    throw error;
  }
};

export const deleteAddress = async (req: Request) => {
  try {
    const { address_id } = req.params;
    const { session_res } = req.body;

    const addressData = await Address.findOne({
      where: { id: address_id, is_deleted: DeleteStatus.No },
    });

    if (!(addressData && addressData.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Address"],
        ]),
      });
    }

    await Address.update(
      {
        is_deleted: DeleteStatus.Yes,
        deleted_at: getLocalDate(),
        deleted_by: session_res.roll_id,
      },
      {
        where: { id: addressData.dataValues.id, is_deleted: DeleteStatus.No },
      }
    );

    return resSuccess({ message: RECORD_DELETED });
  } catch (error) {
    throw error;
  }
};

export const addressList = async (req: Request) => {
  try {
    const { session_res } = req.body;

    const addressData = await Address.findAll({
      where: {
        user_id: session_res.user_id,
        is_deleted: DeleteStatus.No,
      },
      attributes: [
        "id",
        "user_id",
        "first_name",
        "last_name",
        "phone_number",
        "address",
        "city",
        "state",
        "country",
        "postcode",
        "is_default",
      ],
    });

    if (addressData.length === 0) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Address"],
        ]),
        code: DEFAULT_STATUS_CODE_SUCCESS,
      });
    }

    return resSuccess({ data: addressData });
  } catch (error) {
    throw error;
  }
};
