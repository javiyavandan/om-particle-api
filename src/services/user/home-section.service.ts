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
