import { Request } from "express";
import CartProducts from "../../model/cart-product.model";
import {
  getCurrencyPrice,
  getLocalDate,
  prepareMessageFromParams,
  resBadRequest,
  resErrorDataExit,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import { Sequelize } from "sequelize";
import { DeleteStatus, StockStatus } from "../../utils/app-enumeration";
import Master from "../../model/masters.model";
import Diamonds from "../../model/diamond.model";
import Company from "../../model/companys.model";

export const addCartProduct = async (req: Request) => {
  try {
    const {
      product_id,
      quantity = 1,
    } = req.body;
    const { user_id } = req.body.session_res;

    const findProduct = await CartProducts.findOne({
      where: {
        product_id: product_id,
        user_id: user_id,
      },
    });
    if (findProduct && findProduct.dataValues) {
      return resErrorDataExit({ message: "Cart product" });
    }
    const productDetail = await Diamonds.findOne({
      where: {
        id: product_id,
        is_deleted: DeleteStatus.No,
      },
    });
    if (!(productDetail && productDetail.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Product"],
        ]),
      });
    }
    if (productDetail.dataValues.status !== StockStatus.AVAILABLE) {
      return resBadRequest({
        message: "Product not available",
      })
    }

    // create cart product
    const createProduct = await CartProducts.create({
      product_id: product_id,
      user_id: user_id,
      quantity: quantity,
      created_at: getLocalDate(),
      created_by: user_id,
    });
    if (createProduct) {
      const count = await CartProducts.count({ where: { user_id: user_id } });
      return resSuccess({ data: { count, data: createProduct } });
    }
  } catch (error) {
    throw error;
  }
};

export const cartProductList = async (req: Request) => {
  try {
    const { user_id } = req.body.session_res;
    const currency = await getCurrencyPrice(req.query.currency as string);

    const products = await CartProducts.findAll({
      where: { user_id: user_id },
      order: [["id", "DESC"]],
      attributes: [
        "id",
        "user_id",
        "product_id",
        "quantity",
      ],
      include: [
        {
          model: Diamonds,
          as: "product",
          where: {
            is_deleted: DeleteStatus.No,
          },
          attributes: [
            "id",
            "stock_id",
            "status",
            [Sequelize.literal(`"product->shape_master"."name"`), "shapeName"],
            [Sequelize.literal(`"product->shape_master"."id"`), "shapeId"],
            [Sequelize.literal(`"product->clarity_master"."name"`), "clarityName"],
            [Sequelize.literal(`"product->clarity_master"."id"`), "clarityId"],
            [Sequelize.literal(`"product->color_master"."name"`), "colorName"],
            [Sequelize.literal(`"product->color_master"."id"`), "colorId"],
            [Sequelize.literal(`"product->color_intensity_master"."name"`), "color_intensityName"],
            [Sequelize.literal(`"product->color_intensity_master"."id"`), "color_intensityId"],
            [Sequelize.literal(`"product->lab_master"."name"`), "labName"],
            [Sequelize.literal(`"product->lab_master"."id"`), "labId"],
            [Sequelize.literal(`"product->polish_master"."name"`), "polishName"],
            [Sequelize.literal(`"product->polish_master"."id"`), "polishId"],
            [Sequelize.literal(`"product->symmetry_master"."name"`), "symmetryName"],
            [Sequelize.literal(`"product->symmetry_master"."id"`), "symmetryId"],
            [Sequelize.literal(`"product->fluorescence_master"."name"`), "fluorescenceName"],
            [Sequelize.literal(`"product->fluorescence_master"."id"`), "fluorescenceId"],
            [Sequelize.literal(`"product->company_master"."name"`), "companyName"],
            [Sequelize.literal(`"product->company_master"."id"`), "companyId"],
            "quantity",
            "weight",
            [Sequelize.literal(`(rate * ${currency})`), 'rate'],
            "report",
            "video",
            "image",
            "certificate",
            "measurement_height",
            "measurement_width",
            "measurement_depth",
            "table_value",
            "depth_value",
            "ratio",
            "user_comments",
            "admin_comments",
            "local_location",
            "is_active"
          ],
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
        }
      ],
    });

    let totalCartPrice = 0;
    for (let index = 0; index < products.length; index++) {
      const item = products[index].dataValues;
      const itemPrice = item.product.rate * item.product.weight
      products[index].dataValues.totalRate = Number(item.quantity) * Number(itemPrice)
      totalCartPrice += item.quantity * itemPrice;
    }

    return resSuccess({ data: { totalCartPrice: totalCartPrice.toFixed(2), cart_list: products } });
  } catch (error) {
    throw error;
  }
};

export const deleteCartProduct = async (req: Request) => {
  try {
    const { cart_id } = req.params;
    const { user_id } = req.body.session_res;

    // find cart product

    const findProduct = await CartProducts.findOne({
      where: {
        id: cart_id,
      },
    });
    // check cart product exist or not, if not exist then return error
    if (!(findProduct && findProduct.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Cart product"],
        ]),
      });
    }

    // delete cart product
    await CartProducts.destroy({ where: { id: findProduct.dataValues.id } });

    // find cart product count
    const count = await CartProducts.count({ where: { user_id: user_id } });
    return resSuccess({ data: { count } });
  } catch (error) {
    throw error;
  }
};

export const updateQuantity = async (req: Request) => {
  try {
    const { cart_id } = req.params;
    const { quantity } = req.body;
    const { user_id } = req.body.session_res;

    const findCartProduct = await CartProducts.findOne({
      where: {
        id: cart_id,
        user_id: user_id,
      },
    });

    if (!(findCartProduct && findCartProduct.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Cart product"],
        ]),
      });
    }

    await CartProducts.update(
      {
        quantity: quantity,
      },
      {
        where: { id: findCartProduct.dataValues.id },
      }
    );

    return resSuccess();
  } catch (error) {
    throw error;
  }
};
