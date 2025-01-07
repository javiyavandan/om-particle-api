import { Request } from "express";
import {
  columnValueLowerCase,
  getInitialPaginationFromQuery,
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
  DUPLICATE_ERROR_CODE,
  ERROR_NOT_FOUND,
  RECORD_DELETED,
  STATUS_UPDATED,
} from "../../utils/app-messages";
import { Op, Sequelize } from "sequelize";
import {
  ActiveStatus,
  DeleteStatus,
  Image_type,
  Master_type,
} from "../../utils/app-enumeration";
import dbContext from "../../config/dbContext";
import { MasterError } from "../../utils/app-constants";
import { IMAGE_URL } from "../../config/env.var";
import Master from "../../model/masters.model";
import Image from "../../model/image.model";
import { moveFileToS3ByType } from "../../helpers/file-helper";
import Country from "../../model/country.model";

export const addMaster = async (req: Request) => {
  try {
    const {
      name,
      sort_code,
      stone_type,
      id_parent,
      value,
      master_type,
      session_res,
      link,
      import_name,
      order,
      country_id,
    } = req.body;
    const { file } = req;
    let filePath = null;

    if (req.file) {
      const moveFileResult = await moveFileToS3ByType(
        req.file,
        Image_type.Masters
      );

      if (moveFileResult.code !== DEFAULT_STATUS_CODE_SUCCESS) {
        return moveFileResult;
      }

      filePath = moveFileResult.data;
    }
    const slug = name.toLowerCase().replaceAll(" ", "-");

    const duplicateName = await Master.findOne({
      where: [
        { name: columnValueLowerCase("name", name) },
        id_parent && { id_parent: id_parent },
        { master_type: master_type },
        { is_deleted: DeleteStatus.No },
      ],
    });

    const duplicateSortCode = await Master.findOne({
      where: [
        sort_code && sort_code != undefined
          ? {
            sort_code: columnValueLowerCase("sort_code", sort_code),
          }
          : {},
        id_parent && { id_parent: id_parent },
        { master_type: master_type },
        { is_deleted: DeleteStatus.No },
      ],
    });

    if (duplicateName && duplicateName.dataValues) {
      return resBadRequest({
        code: DUPLICATE_ERROR_CODE,
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", MasterError[master_type as keyof typeof MasterError]],
        ]),
      });
    }

    if (sort_code && duplicateSortCode && duplicateSortCode.dataValues) {
      return resBadRequest({
        code: DUPLICATE_ERROR_CODE,
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", MasterError[master_type as keyof typeof MasterError]],
        ]),
      });
    }

    if (id_parent) {
      const parentIdCheck = await Master.findOne({
        where: { id: id_parent },
      });
      if (!parentIdCheck) {
        return resBadRequest({
          code: DUPLICATE_ERROR_CODE,
          message: prepareMessageFromParams(ERROR_NOT_FOUND, [
            ["field_name", "parent data"],
          ]),
        });
      }
    }

    if (country_id) {
      const country = await Country.findOne({
        where: { id: country_id, is_deleted: DeleteStatus.No },
      })

      if (!(country && country.dataValues)) {
        return resNotFound({
          message: prepareMessageFromParams(ERROR_NOT_FOUND, [
            ["field_name", "country"],
          ])
        })
      }
    }

    const trn = await dbContext.transaction();

    let imageId;
    try {
      if (file) {
        if (filePath) {
          const imageResult = await Image.create(
            {
              image_path: filePath,
              created_at: getLocalDate(),
              created_by: session_res.user_id,
              is_deleted: DeleteStatus.No,
              is_active: ActiveStatus.Active,
              image_type: master_type,
            },
            { transaction: trn }
          );
          imageId = imageResult.dataValues.id;
        }
      }
      await Master.create(
        {
          name,
          slug,
          sort_code,
          id_image: imageId,
          id_parent,
          value,
          link,
          import_name,
          master_type,
          order_by: order,
          stone_type: stone_type,
          is_deleted: DeleteStatus.No,
          is_active: ActiveStatus.Active,
          created_at: getLocalDate(),
          created_by: session_res.user_id,
          country_id: country_id ?? null,
        },
        { transaction: trn }
      );
      await trn.commit();
      await refreshMaterializedDiamondListView()

      return resSuccess();
    } catch (e) {
      trn.rollback();
      throw e;
    }
  } catch (error) {
    throw error;
  }
};

export const updateMaster = async (req: Request) => {
  try {
    const { id } = req.params;
    const {
      name,
      sort_code,
      stone_type,
      id_parent,
      value,
      master_type,
      session_res,
      link,
      import_name,
      order,
      country_id,
    } = req.body;
    const slug = name.toLowerCase().replaceAll(" ", "-");
    let filePath = null;

    if (req.file) {
      const moveFileResult = await moveFileToS3ByType(
        req.file,
        Image_type.Masters
      );

      if (moveFileResult.code !== DEFAULT_STATUS_CODE_SUCCESS) {
        return moveFileResult;
      }

      filePath = moveFileResult.data;
    }

    const duplicateName = await Master.findOne({
      where: [
        { id: { [Op.ne]: id } },
        { name: columnValueLowerCase("name", name) },
        { master_type: master_type },
        id_parent && { id_parent: id_parent },
        { is_deleted: DeleteStatus.No },
      ],
    });

    const duplicateSortCode = await Master.findOne({
      where: [
        { id: { [Op.ne]: id } },
        sort_code && sort_code != undefined
          ? {
            sort_code: columnValueLowerCase("sort_code", sort_code),
          }
          : {},
        id_parent && { id_parent: id_parent },
        { master_type: master_type },
        { is_deleted: DeleteStatus.No },
      ],
    });

    if (duplicateName && duplicateName.dataValues) {
      return resBadRequest({
        code: DUPLICATE_ERROR_CODE,
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", MasterError[master_type as keyof typeof MasterError]],
        ]),
      });
    }

    if (sort_code && duplicateSortCode && duplicateSortCode.dataValues) {
      return resBadRequest({
        code: DUPLICATE_ERROR_CODE,
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", MasterError[master_type as keyof typeof MasterError]],
        ]),
      });
    }

    const MasterData = await Master.findOne({
      where: {
        id: id,
        is_deleted: DeleteStatus.No,
        master_type: master_type,
      },
    });

    if (id_parent) {
      const parentIdCheck = await Master.findOne({
        where: { id: id_parent },
      });
      if (!parentIdCheck) {
        return resBadRequest({
          code: DUPLICATE_ERROR_CODE,
          message: prepareMessageFromParams(ERROR_NOT_FOUND, [
            ["field_name", "parent data"],
          ]),
        });
      }
    }

    if (country_id) {
      const country = await Country.findOne({
        where: { id: country_id, is_deleted: DeleteStatus.No },
      })

      if (!(country && country.dataValues)) {
        return resNotFound({
          message: prepareMessageFromParams(ERROR_NOT_FOUND, [
            ["field_name", "country"],
          ])
        })
      }
    }

    const trn = await dbContext.transaction();

    if (MasterData) {
      const imageUpdate = await Image.findOne({
        where: {
          id: MasterData.dataValues.id_image,
          is_deleted: DeleteStatus.No,
        },
      });
      if (imageUpdate) {
        const { file } = req;
        if (file) {
          await Image.update(
            {
              image_path: filePath,
              modified_at: getLocalDate(),
              modified_by: session_res.user_id,
              is_deleted: DeleteStatus.No,
              image_type: master_type,
            },
            {
              where: { id: imageUpdate.dataValues.id },
              transaction: trn,
            }
          );
        }
      }
      await Master.update(
        {
          name: name,
          slug: slug,
          sort_code: sort_code,
          stone_type: stone_type,
          id_image: imageUpdate?.dataValues.id,
          id_parent,
          value,
          order_by: order,
          link: link,
          import_name,
          is_deleted: DeleteStatus.No,
          modified_at: getLocalDate(),
          modified_by: session_res.user_id,
          country_id: country_id ?? null,
        },
        {
          where: {
            id: MasterData.dataValues.id,
            is_deleted: DeleteStatus.No,
          },
        }
      );

      trn.commit();
      await refreshMaterializedDiamondListView()

      return resSuccess();
    } else {
      return resBadRequest({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", MasterError[master_type as keyof typeof MasterError]],
        ]),
      });
    }
  } catch (error) {
    throw error;
  }
};

export const masterList = async (req: Request) => {
  try {
    const { master_type } = req.params;
    const { query } = req;
    let pagination = {
      ...getInitialPaginationFromQuery(query),
      search_text: query.search_text,
    };

    let where = [
      { is_deleted: DeleteStatus.No },
      { master_type: master_type },
      pagination.is_active ? { is_active: pagination.is_active } : {},
      pagination.search_text
        ? {
          [Op.or]: {
            name: { [Op.iLike]: `%${pagination.search_text}%` },
            slug: { [Op.iLike]: `%${pagination.search_text}%` },
          },
        }
        : {},
    ];

    const totalItems = await Master.count({
      where,
    });

    if (totalItems === 0) {
      return resSuccess({ data: { pagination, result: [] } });
    }

    pagination.total_items = totalItems;
    pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

    const MasterData = await Master.findAll({
      where,
      limit: pagination.per_page_rows,
      offset: (pagination.current_page - 1) * pagination.per_page_rows,
      order: [[pagination.sort_by, pagination.order_by]],
      attributes: [
        "id",
        "name",
        "slug",
        "value",
        "sort_code",
        "is_active",
        "stone_type",
        "id_image",
        "id_parent",
        "link",
        "import_name",
        "country_id",
        "order_by",
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
    return resSuccess({ data: { pagination, result: MasterData } });
  } catch (error) {
    throw error;
  }
};

export const masterDetail = async (req: Request) => {
  try {
    const { id, master_type } = req.params;

    const MasterData = await Master.findOne({
      where: {
        id: id,
        is_deleted: DeleteStatus.No,
        master_type: master_type,
      },
      attributes: [
        "id",
        "name",
        "slug",
        "value",
        "sort_code",
        "is_active",
        "stone_type",
        "id_image",
        "id_parent",
        "link",
        "country_id",
        "import_name",
        "order_by",
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

    if (!(MasterData && MasterData.dataValues)) {
      return resBadRequest({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", MasterError[master_type as keyof typeof MasterError]],
        ]),
      });
    }

    return resSuccess({ data: MasterData });
  } catch (error) {
    throw error;
  }
};

export const masterStatusUpdate = async (req: Request) => {
  try {
    const { id, master_type } = req.params;
    const { session_res } = req.body;

    const MasterData = await Master.findOne({
      where: {
        id: id,
        is_deleted: DeleteStatus.No,
        master_type: master_type,
      },
    });

    if (!(MasterData && MasterData.dataValues)) {
      return resBadRequest({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", MasterError[master_type as keyof typeof MasterError]],
        ]),
      });
    }

    switch (MasterData?.dataValues.is_active) {
      case ActiveStatus.Active:
        await Master.update(
          {
            is_active: ActiveStatus.InActive,
            modified_at: getLocalDate(),
            modified_by: session_res.user_id,
          },
          { where: { id: MasterData.dataValues.id } }
        );
        await refreshMaterializedDiamondListView()
        return resSuccess({ message: STATUS_UPDATED });

      case ActiveStatus.InActive:
        await Master.update(
          {
            is_active: ActiveStatus.Active,
            modified_at: getLocalDate(),
            modified_by: session_res.user_id,
          },
          { where: { id: MasterData.dataValues.id } }
        );
        await refreshMaterializedDiamondListView()
        return resSuccess({ message: STATUS_UPDATED });

      default:
        break;
    }
  } catch (error) {
    throw error;
  }
};

export const masterDelete = async (req: Request) => {
  try {
    const { id, master_type } = req.params;
    const { session_res } = req.body;

    const MasterData = await Master.findOne({
      where: {
        id: id,
        is_deleted: DeleteStatus.No,
        master_type: master_type,
      },
    });

    const ParentData = await Master.findAll({
      where: {
        id_parent: id,
        master_type: master_type,
        is_deleted: DeleteStatus.No,
      },
    });

    if (!(MasterData && MasterData.dataValues)) {
      return resBadRequest({
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", MasterError[master_type as keyof typeof MasterError]],
        ]),
      });
    }

    if (ParentData.length > 0) {
      await Master.update(
        {
          id_deleted: DeleteStatus.Yes,
          deleted_at: getLocalDate(),
          deleted_by: session_res.id,
        },
        {
          where: { id: ParentData.map((t) => t.dataValues.id) },
        }
      );
    }

    await Master.update(
      {
        is_deleted: DeleteStatus.Yes,
        deleted_at: getLocalDate(),
        deleted_by: session_res.id,
      },
      {
        where: { id: MasterData.dataValues.id },
      }
    );

    await refreshMaterializedDiamondListView()
    return resSuccess({ message: RECORD_DELETED });
  } catch (error) {
    throw error;
  }
};
