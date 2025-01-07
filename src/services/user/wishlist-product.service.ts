import { Request } from "express";
import Wishlist from "../../model/wishlist.model";
import {
  columnValueLowerCase,
  getLocalDate,
  prepareMessageFromParams,
  refreshMaterializedDiamondListView,
  resBadRequest,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import {
  DATA_ALREADY_EXITS,
  DEFAULT_STATUS_CODE_SUCCESS,
  ERROR_NOT_FOUND,
  RECORD_DELETED,
} from "../../utils/app-messages";
import Diamonds from "../../model/diamond.model";
import { Sequelize } from "sequelize";
import WishlistFolder from "../../model/wishlist-folder";
import dbContext from "../../config/dbContext";
import { create_wishlist_product } from "../../data/interfaces/common/common.interface";
import { DeleteStatus } from "../../utils/app-enumeration";
import Master from "../../model/masters.model";
import Company from "../../model/companys.model";

export const createFolder = async (req: Request) => {
  try {
    const { name, session_res } = req.body;

    const duplicateFolder = await WishlistFolder.findOne({
      where: {
        name: columnValueLowerCase("name", name || ""),
        user_id: session_res.user_id,
      },
    });

    if (duplicateFolder && duplicateFolder.dataValues) {
      return resBadRequest({
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", "Folder"],
        ]),
      });
    }

    await WishlistFolder.create({
      name: name,
      user_id: session_res.user_id,
      created_at: getLocalDate(),
      created_by: session_res.user_id,
    });

    return resSuccess();
  } catch (error) {
    throw error;
  }
};

export const wishlistProduct = async (req: Request) => {
  try {
    const {
      folder_id,
      folder_name,
      session_res,
      product_details,
    } = req.body;

    const trn = await dbContext.transaction();
    try {
      let folder: any;

      if (folder_id === 0) {
        const duplicateFolder = await WishlistFolder.findOne({
          where: {
            name: columnValueLowerCase("name", folder_name),
            user_id: session_res.user_id,
          },
        });

        if (duplicateFolder && duplicateFolder.dataValues) {
          return resBadRequest({
            message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
              ["field_name", "Folder"],
            ]),
          });
        }

        folder = await WishlistFolder.create(
          {
            name: folder_name,
            user_id: session_res.user_id,
            created_at: getLocalDate(),
            created_by: session_res.user_id,
          },
          { transaction: trn }
        );
      } else {
        const folderData = await WishlistFolder.findOne({
          where: {
            id: folder_id,
            name: columnValueLowerCase("name", folder_name),
            user_id: session_res.user_id,
          },
        });

        if (!(folderData && folderData.dataValues)) {
          return resNotFound({
            message: prepareMessageFromParams(ERROR_NOT_FOUND, [
              ["field_name", "Wishlist Folder"],
            ]),
          });
        }
      }
      let wishListProductList: create_wishlist_product[] = [];

      for (let value of product_details) {
        if (
          wishListProductList?.filter((t) => t.product_id == value)
            .length > 0
        ) {
          continue;
        }
        const wishlistData = await Diamonds.findOne({
          where: {
            id: value,
            is_deleted: DeleteStatus.No,
          },
          transaction: trn,
        });

        if (!(wishlistData && wishlistData.dataValues)) {
          return resNotFound({
            message: prepareMessageFromParams(ERROR_NOT_FOUND, [
              ["field_name", `ID #${value} Diamond`],
            ]),
            code: DEFAULT_STATUS_CODE_SUCCESS,
          });
        }
        const existingWishlistItems = await Wishlist.findOne({
          where: {
            product_id: value,
            folder_id: folder_id === 0 ? folder.dataValues.id : folder_id,
          },
          transaction: trn,
        });
        if (!(existingWishlistItems && existingWishlistItems.dataValues)) {
          wishListProductList.push({
            product_id: wishlistData.dataValues.id,
            user_id: session_res.user_id,
            folder_id: folder_id === 0 ? folder.dataValues.id : folder_id,
            created_at: getLocalDate(),
            created_by: session_res.user_id,
          });
        }
      }
      await Wishlist.bulkCreate(wishListProductList as any, {
        transaction: trn,
      });
      const count = await Wishlist.count({
        where: { user_id: session_res.user_id },
        include: [{
          model: Diamonds,
          as: "product",
          attributes: [],
          where: {
            is_deleted: DeleteStatus.No,
          }
        }],
        transaction: trn,
      });

      trn.commit();
      refreshMaterializedDiamondListView()
      return resSuccess({ data: { count } });
    } catch (error) {
      trn.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

export const deleteWishlist = async (req: Request) => {
  try {
    const { wishlist_id, folder_id } = req.params;
    const { user_id } = req.body.session_res;
    const { product_id } = req.body;

    if (wishlist_id === "0" && folder_id === "0") {
      const trn = await dbContext.transaction();
      try {
        await Wishlist.destroy({
          where: {
            user_id: user_id,
            product_id: product_id,
          },
          transaction: trn,
        });

        const count = await Wishlist.count({
          where: { user_id: user_id },
          transaction: trn,
        });

        trn.commit();
        refreshMaterializedDiamondListView()
        return resSuccess({ data: { count }, message: RECORD_DELETED });
      } catch (error) {
        trn.rollback();
        throw error;
      }
    }

    if (wishlist_id === "0" && folder_id !== "0") {
      const folderData = await WishlistFolder.findOne({
        where: { id: folder_id },
      });

      if (!(folderData && folderData.dataValues)) {
        return resNotFound({
          message: prepareMessageFromParams(ERROR_NOT_FOUND, [
            ["field_name", "Folder"],
          ]),
        });
      }

      const trn = await dbContext.transaction();

      try {
        await Wishlist.destroy({
          where: {
            folder_id: folder_id,
          },
          transaction: trn,
        });
        await WishlistFolder.destroy({
          where: { id: folder_id },
          transaction: trn,
        });

        const count = await Wishlist.count({
          where: { user_id: user_id },
          transaction: trn,
        });

        trn.commit();
        refreshMaterializedDiamondListView()
        return resSuccess({ data: { count }, message: RECORD_DELETED });
      } catch (error) {
        trn.rollback();
        throw error;
      }
    }

    const wishlistData = await Wishlist.findOne({
      where: { id: wishlist_id, folder_id },
    });

    if (!(wishlistData && wishlistData.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Wishlist Product"],
        ]),
      });
    }

    await Wishlist.destroy({
      where: { id: wishlist_id, folder_id },
    });
    const count = await Wishlist.count({ where: { user_id: user_id } });

    refreshMaterializedDiamondListView()
    return resSuccess({ data: { count }, message: RECORD_DELETED });
  } catch (error) {
    throw error;
  }
};

export const wishlist = async (req: Request) => {
  try {
    const { session_res } = req.body;

    const wishlistData = await Wishlist.findAll({
      order: [["id", "DESC"]],
      where: {
        user_id: session_res.user_id,
      },
      attributes: [
        "id",
        "user_id",
        "product_id",
        [Sequelize.literal(`"wishlist_folder"."id"`), "folder_id"],
        [Sequelize.literal(`"wishlist_folder"."name"`), "folder_name"],
      ],
      include: [
        {
          model: WishlistFolder,
          as: "wishlist_folder",
          attributes: [],
        },
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
            "rate",
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

    return resSuccess({ data: wishlistData });
  } catch (error) {
    throw error;
  }
};

export const folderList = async (req: Request) => {
  try {
    const { session_res } = req.body;

    const folderData = await WishlistFolder.findAll({
      where: {
        user_id: session_res.user_id,
      },
    });

    return resSuccess({ data: folderData });
  } catch (error) {
    throw error;
  }
};
