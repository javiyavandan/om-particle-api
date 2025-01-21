import { Request } from "express";
import StaticPage from "../../model/static-page.model";
import {
  columnValueLowerCase,
  getInitialPaginationFromQuery,
  getLocalDate,
  prepareMessageFromParams,
  resBadRequest,
  resSuccess,
} from "../../utils/shared-functions";
import { ActiveStatus, DeleteStatus } from "../../utils/app-enumeration";
import {
  DUPLICATE_ERROR_CODE,
  DATA_ALREADY_EXITS,
  ERROR_NOT_FOUND,
  NOT_FOUND_CODE,
  STATUS_UPDATED,
} from "../../utils/app-messages";
import { Op } from "sequelize";

export const addStaticPage = async (req: Request) => {
  try {
    const { name, slug, description, session_res } = req.body;

    const duplicateSlug = await StaticPage.findOne({
      where: {
        slug: columnValueLowerCase("slug", slug),
        is_deleted: DeleteStatus.No,
      },
    });

    if (duplicateSlug && duplicateSlug.dataValues) {
      return resBadRequest({
        code: DUPLICATE_ERROR_CODE,
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", "Static Page"],
        ]),
      });
    }
    const duplicateName = await StaticPage.findOne({
      where: {
        name: columnValueLowerCase("name", name),
        is_deleted: DeleteStatus.No,
      },
    });

    if (duplicateName && duplicateName.dataValues) {
      return resBadRequest({
        code: DUPLICATE_ERROR_CODE,
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", "Static Page"],
        ]),
      });
    }

    await StaticPage.create({
      name: name,
      slug: slug,
      description: description,
      created_at: getLocalDate(),
      created_by: session_res.user_id,
      is_deleted: DeleteStatus.No,
    });

    return resSuccess();
  } catch (error) {
    throw error;
  }
};

export const updateStaticPage = async (req: Request) => {
  try {
    const { page_id } = req.params;
    const { name, slug, description, session_res } = req.body;

    const duplicateSlug = await StaticPage.findOne({
      where: {
        id: { [Op.ne]: page_id },
        slug: columnValueLowerCase("slug", slug),
        is_deleted: DeleteStatus.No,
      },
    });

    if (duplicateSlug && duplicateSlug.dataValues) {
      return resBadRequest({
        code: DUPLICATE_ERROR_CODE,
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", "Static page"],
        ]),
      });
    }
    const duplicateName = await StaticPage.findOne({
      where: {
        id: { [Op.ne]: page_id },
        name: columnValueLowerCase("name", name),
        is_deleted: DeleteStatus.No,
      },
    });

    if (duplicateName && duplicateName.dataValues) {
      return resBadRequest({
        code: DUPLICATE_ERROR_CODE,
        message: prepareMessageFromParams(DATA_ALREADY_EXITS, [
          ["field_name", "Static page"],
        ]),
      });
    }

    const pageData = await StaticPage.findOne({
      where: {
        id: page_id,
        is_deleted: DeleteStatus.No,
      },
    });

    if (!(pageData && pageData.dataValues)) {
      return resBadRequest({
        code: NOT_FOUND_CODE,
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Page"],
        ]),
      });
    }

    await StaticPage.update(
      {
        name: name,
        slug: slug,
        description: description,
        modified_at: getLocalDate(),
        modified_by: session_res.user_id,
      },
      {
        where: { id: pageData.dataValues.id },
      }
    );

    return resSuccess();
  } catch (error) {
    throw error;
  }
};

export const staticPageList = async (req: Request) => {
  try {
    const { query } = req;
    let pagination = {
      ...getInitialPaginationFromQuery(query),
      search_text: query.search_text,
    };

    let where = [
      { is_deleted: DeleteStatus.No },
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

    const totalItems = await StaticPage.count({
      where,
    });

    if (totalItems === 0) {
      return resSuccess({ data: { pagination, result: [] } });
    }

    pagination.total_items = totalItems;
    pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

    const pageData = await StaticPage.findAll({
      where,
      limit: pagination.per_page_rows,
      offset: (pagination.current_page - 1) * pagination.per_page_rows,
      order: [[pagination.sort_by, pagination.order_by]],
      attributes: ["id", "name", "slug", "description", "is_active"],
    });

    return resSuccess({ data: { pagination, result: pageData } });
  } catch (error) {
    throw error;
  }
};

export const staticPageDetail = async (req: Request) => {
  try {
    const { page_id } = req.params;
    const pageData = await StaticPage.findOne({
      where: {
        id: page_id,
        is_deleted: DeleteStatus.No,
      },
      attributes: ["id", "name", "slug", "description", "is_active"],
    });
    if (!(pageData && pageData.dataValues)) {
      return resBadRequest({
        code: NOT_FOUND_CODE,
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Page"],
        ]),
      });
    }

    return resSuccess({ data: pageData });
  } catch (error) {
    throw error;
  }
};

export const staticPageStatusUpdate = async (req: Request) => {
  try {
    const { session_res } = req.body;
    const { page_id } = req.params;
    const pageData = await StaticPage.findOne({
      where: {
        id: page_id,
        is_deleted: DeleteStatus.No,
      },
    });
    if (!(pageData && pageData.dataValues)) {
      return resBadRequest({
        code: NOT_FOUND_CODE,
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Page"],
        ]),
      });
    }

    switch (pageData?.dataValues.is_active) {
      case ActiveStatus.Active:
        await StaticPage.update(
          {
            is_active: ActiveStatus.InActive,
            modified_at: getLocalDate(),
            modified_by: session_res.user_id,
          },
          { where: { id: pageData.dataValues.id } }
        );
        return resSuccess({ message: STATUS_UPDATED });

      case ActiveStatus.InActive:
        await StaticPage.update(
          {
            is_active: ActiveStatus.Active,
            modified_at: getLocalDate(),
            modified_by: session_res.user_id,
          },
          { where: { id: pageData.dataValues.id } }
        );
        return resSuccess({ message: STATUS_UPDATED });

      default:
        break;
    }
  } catch (error) {
    throw error;
  }
};

export const deleteStaticPage = async (req: Request) => {
  try {
    const { session_res } = req.body;
    const { page_id } = req.params;
    const pageData = await StaticPage.findOne({
      where: {
        id: page_id,
        is_deleted: DeleteStatus.No,
      },
    });
    if (!(pageData && pageData.dataValues)) {
      return resBadRequest({
        code: NOT_FOUND_CODE,
        message: prepareMessageFromParams(ERROR_NOT_FOUND, [
          ["field_name", "Page"],
        ]),
      });
    }

    await StaticPage.update(
      {
        is_deleted: DeleteStatus.Yes,
        deleted_at: getLocalDate(),
        deleted_by: session_res.user_id,
      },
      {
        where: { id: pageData.dataValues.id },
      }
    );

    return resSuccess();
  } catch (error) {
    throw error;
  }
};
