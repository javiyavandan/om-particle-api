import { Request } from "express";
import {
  genrerateRandomString,
  getLocalDate,
  prepareMessageFromParams,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import dbContext from "../../config/dbContext";
import ShareProducts from "../../model/share-products.model";
import Diamond from "../../model/diamond.model";
import {
  ERROR_NOT_FOUND,
  RESOURCE_NOT_FOUND,
} from "../../utils/app-messages";
import { FRONT_END_BASE_URL, SHARE_PRODUCT_PATH } from "../../config/env.var";
import { Sequelize } from "sequelize";
import { DeleteStatus } from "../../utils/app-enumeration";
import Master from "../../model/masters.model";
import Company from "../../model/companys.model";

export const createShareProduct = async (req: Request) => {
  try {
    const { phone_number, products } = req.body;
    const { user_id } = req.body.session_res;

    let errors = [];
    let shareLinkList = [];
    for (let product of products) {
      const diamond = await Diamond.findOne({
        where: { id: product.product_id, is_deleted: DeleteStatus.No },
      });

      if (!(diamond && diamond.dataValues)) {
        errors.push({
          message: prepareMessageFromParams(ERROR_NOT_FOUND, [
            ["field_name", `#${product.product_id} product`],
          ]),
        });
      }
    }

    if (errors.length > 0) {
      return resNotFound({ data: errors });
    }
    const trn = await dbContext.transaction();
    try {
      let shareProductsList = [];
      for (let product of products) {
        const shareId = await genrerateRandomString(32);
        shareLinkList.push(
          `${FRONT_END_BASE_URL}${SHARE_PRODUCT_PATH}${shareId}`
        );
        shareProductsList.push({
          share_id: shareId,
          phone_number: phone_number,
          id_product: product.product_id,
          price: product.markup,
          created_at: getLocalDate(),
          created_by: user_id,
        });
      }

      await ShareProducts.bulkCreate(shareProductsList, {
        transaction: trn,
      });

      await trn.commit();
      return resSuccess({ data: shareLinkList });
    } catch (error) {
      await trn.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

export const shareProduct = async (req: Request) => {
  try {
    const { share_id } = req.params;
    const shareProduct = await ShareProducts.findOne({
      where: { share_id: share_id },
      attributes: [
        [Sequelize.literal(`diamond_product.id`), "id"],
        [Sequelize.literal(`diamond_product.stock_id`), "stock_id"],
        [Sequelize.literal(`diamond_product.status`), "status"],
        [Sequelize.literal(`diamond_product.quantity`), "quantity"],
        [Sequelize.literal(`diamond_product.weight`), "weight"],
        [Sequelize.literal(`price`), "rate"],
        [Sequelize.literal(`diamond_product.report`), "report"],
        [Sequelize.literal(`diamond_product.video`), "video"],
        [Sequelize.literal(`diamond_product.image`), "image"],
        [Sequelize.literal(`diamond_product.certificate`), "certificate"],
        [Sequelize.literal(`diamond_product.measurement_height`), "measurement_height"],
        [Sequelize.literal(`diamond_product.measurement_width`), "measurement_width"],
        [Sequelize.literal(`diamond_product.measurement_depth`), "measurement_depth"],
        [Sequelize.literal(`diamond_product.table_value`), "table_value"],
        [Sequelize.literal(`diamond_product.depth_value`), "depth_value"],
        [Sequelize.literal(`diamond_product.ratio`), "ratio"],
        [Sequelize.literal(`diamond_product.user_comments`), "user_comments"],
        [Sequelize.literal(`diamond_product.admin_comments`), "admin_comments"],
        [Sequelize.literal(`diamond_product.local_location`), "local_location"],
        [Sequelize.literal(`"diamond_product->shape_master"."name"`), "shapeName"],
        [Sequelize.literal(`"diamond_product->shape_master"."id"`), "shapeId"],
        [Sequelize.literal(`"diamond_product->clarity_master"."name"`), "clarityName"],
        [Sequelize.literal(`"diamond_product->clarity_master"."id"`), "clarityId"],
        [Sequelize.literal(`"diamond_product->color_master"."name"`), "colorName"],
        [Sequelize.literal(`"diamond_product->color_master"."id"`), "colorId"],
        [Sequelize.literal(`"diamond_product->color_intensity_master"."name"`), "color_intensityName"],
        [Sequelize.literal(`"diamond_product->color_intensity_master"."id"`), "color_intensityId"],
        [Sequelize.literal(`"diamond_product->lab_master"."name"`), "labName"],
        [Sequelize.literal(`"diamond_product->lab_master"."id"`), "labId"],
        [Sequelize.literal(`"diamond_product->polish_master"."name"`), "polishName"],
        [Sequelize.literal(`"diamond_product->polish_master"."id"`), "polishId"],
        [Sequelize.literal(`"diamond_product->symmetry_master"."name"`), "symmetryName"],
        [Sequelize.literal(`"diamond_product->symmetry_master"."id"`), "symmetryId"],
        [Sequelize.literal(`"diamond_product->fluorescence_master"."name"`), "fluorescenceName"],
        [Sequelize.literal(`"diamond_product->fluorescence_master"."id"`), "fluorescenceId"],
        [Sequelize.literal(`"diamond_product->company_master"."name"`), "companyName"],
        [Sequelize.literal(`"diamond_product->company_master"."id"`), "companyId"],
      ],
      include: [
        {
          model: Diamond,
          as: "diamond_product",
          attributes: [],
          include: [
            {
              model: Master,
              as: "shape_master",
              attributes: [],
            },
            {
              model: Master,
              as: "color_master",
              attributes: [],
            },
            {
              model: Master,
              as: "color_intensity_master",
              attributes: [],
            },
            {
              model: Master,
              as: "clarity_master",
              attributes: [],
            },
            {
              model: Master,
              as: "lab_master",
              attributes: [],
            },
            {
              model: Master,
              as: "polish_master",
              attributes: [],
            },
            {
              model: Master,
              as: "symmetry_master",
              attributes: [],
            },
            {
              model: Master,
              as: "fluorescence_master",
              attributes: [],
            },
            {
              model: Company,
              as: "company_master",
              attributes: [],
            },
          ]
        },
      ],
    });
    if (!(shareProduct && shareProduct.dataValues)) {
      return resNotFound({ message: RESOURCE_NOT_FOUND });
    }

    return resSuccess({ data: shareProduct });
  } catch (error) {
    throw error;
  }
};
