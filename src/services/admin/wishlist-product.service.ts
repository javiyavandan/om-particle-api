import { Request } from "express";
import Wishlist from "../../model/wishlist.model";
import { Op, Sequelize } from "sequelize";
import {
  getInitialPaginationFromQuery,
  prepareMessageFromParams,
  resNotFound,
  resSuccess,
} from "../../utils/shared-functions";
import AppUser from "../../model/app_user.model";
import Image from "../../model/image.model";
import { ERROR_NOT_FOUND } from "../../utils/app-messages";
import WishlistFolder from "../../model/wishlist-folder";
import { IMAGE_URL } from "../../config/env.var";
import Customer from "../../model/customer.modal";
import Master from "../../model/masters.model";
import Company from "../../model/companys.model";
import Diamonds from "../../model/diamond.model";
import { DeleteStatus } from "../../utils/app-enumeration";

export const getWishlist = async (req: Request) => {
  try {
    const { query } = req;
    let pagination = {
      ...getInitialPaginationFromQuery(query),
      search_text: query.search_text,
    };
    let noPagination = req.query.no_pagination === "1";
    let paginationProps = {};

    let where = [
      pagination.is_active ? { is_active: pagination.is_active } : {},
      pagination.search_text
        ? Sequelize.or(
          Sequelize.where(
            Sequelize.literal(`"user->customer"."company_name"`),
            "iLike",
            `%${pagination.search_text}%`
          ),
          Sequelize.where(
            Sequelize.literal(`"user"."first_name"`),
            "iLike",
            `%${pagination.search_text}%`
          ),
          Sequelize.where(
            Sequelize.literal(`"user"."last_name"`),
            "iLike",
            `%${pagination.search_text}%`
          ),
          Sequelize.where(
            Sequelize.literal(`"wishlist_folder"."name"`),
            "iLike",
            `%${pagination.search_text}%`
          )
        )
        : {},
    ];

    let include: any = [
      {
        model: AppUser,
        as: "user",
        attributes: [],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: [],
          },

          {
            model: Image,
            as: "image",
            attributes: [],
          },
        ],
      },
      {
        model: Diamonds,
        as: "product",
        where: [
          { is_deleted: DeleteStatus.No, },
          req.body.session_res.company_id ? { company_id: req.body.session_res.company_id } : {}
        ],
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
      },
      {
        model: WishlistFolder,
        as: "wishlist_folder",
        attributes: [],
      },
    ];

    if (!noPagination) {
      const totalItems = await Wishlist.count({
        where,
        include,
      });

      if (totalItems === 0) {
        return resSuccess({ data: { pagination, result: [] } });
      }
      pagination.total_items = totalItems;
      pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

      paginationProps = {
        limit: pagination.per_page_rows,
        offset: (pagination.current_page - 1) * pagination.per_page_rows,
      };
    }

    const wishlistData = await Wishlist.findAll({
      where,
      limit: pagination.per_page_rows,
      offset: (pagination.current_page - 1) * pagination.per_page_rows,
      order: [[pagination.sort_by, pagination.order_by]],
      attributes: [
        "id",
        "user_id",
        "product_id",
        [Sequelize.literal(`"wishlist_folder"."id"`), "folder_id"],
        [Sequelize.literal(`"wishlist_folder"."name"`), "folder_name"],
        [Sequelize.literal(`"user"."first_name"`), "first_name"],
        [Sequelize.literal(`"user"."last_name"`), "last_name"],
        [Sequelize.literal(`"user"."email"`), "email"],
        [Sequelize.literal(`"user"."phone_number"`), "phone_number"],
        [Sequelize.literal(`"user"."is_active"`), "is_active"],
        [Sequelize.literal(`"user"."user_type"`), "user_type"],
        [Sequelize.literal(`"user"."id_image"`), "id_image"],
        [
          Sequelize.fn(
            "CONCAT",
            IMAGE_URL,
            Sequelize.literal(`"user->image"."image_path"`)
          ),
          "image_path",
        ],
        [Sequelize.literal(`"user->customer"."id"`), "company_id"],
        [Sequelize.literal(`"user->customer"."company_name"`), "company_name"],
        [
          Sequelize.literal(`"user->customer"."company_website"`),
          "company_website",
        ],
        [Sequelize.literal(`"user->customer"."address"`), "address"],
        [Sequelize.literal(`"user->customer"."city"`), "city"],
        [Sequelize.literal(`"user->customer"."state"`), "state"],
        [Sequelize.literal(`"user->customer"."country"`), "country"],
        [Sequelize.literal(`"user->customer"."postcode"`), "postcode"],
        [Sequelize.literal(`"user->customer"."registration_number"`), "registration_number"],
      ],
      include: include,
    });

    return resSuccess({ data: noPagination? wishlistData : { pagination, result: wishlistData } });
  } catch (error) {
    throw error;
  }
};

export const getWishlistDetails = async (req: Request) => {
  try {
    const { wishlist_id } = req.params;

    const wishlistData = await Wishlist.findOne({
      where: {
        id: wishlist_id,
      },
      attributes: [
        "id",
        "user_id",
        "product_id",
        [Sequelize.literal(`"wishlist_folder"."id"`), "folder_id"],
        [Sequelize.literal(`"wishlist_folder"."name"`), "folder_name"],
        [Sequelize.literal(`"user"."first_name"`), "first_name"],
        [Sequelize.literal(`"user"."last_name"`), "last_name"],
        [Sequelize.literal(`"user"."email"`), "email"],
        [Sequelize.literal(`"user"."phone_number"`), "phone_number"],
        [Sequelize.literal(`"user"."is_active"`), "is_active"],
        [Sequelize.literal(`"user"."user_type"`), "user_type"],
        [Sequelize.literal(`"user"."id_image"`), "id_image"],
        [
          Sequelize.fn(
            "CONCAT",
            IMAGE_URL,
            Sequelize.literal(`"user->image"."image_path"`)
          ),
          "image_path",
        ],
        [Sequelize.literal(`"user->customer"."id"`), "company_id"],
        [Sequelize.literal(`"user->customer"."company_name"`), "company_name"],
        [
          Sequelize.literal(`"user->customer"."company_website"`),
          "company_website",
        ],
        [Sequelize.literal(`"user->customer"."address"`), "address"],
        [Sequelize.literal(`"user->customer"."city"`), "city"],
        [Sequelize.literal(`"user->customer"."state"`), "state"],
        [Sequelize.literal(`"user->customer"."country"`), "country"],
        [Sequelize.literal(`"user->customer"."postcode"`), "postcode"],
        [Sequelize.literal(`"user->customer"."registration_number"`), "registration_number"],
      ],
      include: [
        {
          model: AppUser,
          as: "user",
          attributes: [],
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: [],
            },

            {
              model: Image,
              as: "image",
              attributes: [],
            },
          ],
        },
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

    if (!(wishlistData && wishlistData.dataValues)) {
      return resNotFound({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Wishlist product"],
        ]),
      });
    }

    return resSuccess({ data: wishlistData });
  } catch (error) {
    throw error;
  }
};
