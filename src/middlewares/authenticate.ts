import { Request, RequestHandler, Response } from "express";
import { verifyJWT } from "../helpers/jwt.helper";
import { BASE_MASTER_URL, JWT_EXPIRED_ERROR_NAME } from "../utils/app-constants";
import {
  DEFAULT_STATUS_CODE_ERROR,
  UNAUTHORIZED_ACCESS_CODE,
  BAD_REQUEST_CODE,
  DEFAULT_STATUS_CODE_SUCCESS,
  AUTHORIZATION_TOKEN_IS_REQUIRED,
  HTTP_METHOD_NOT_FOUND,
  ROLE_API_PERMISSION_NOT_FOUND,
} from "../utils/app-messages";
import {
  getMethodFromRequest,
  resBadRequest,
  resUnauthorizedAccess,
  resUnknownError,
} from "../utils/shared-functions";
import {
  ActiveStatus,
  DeleteStatus,
  UserType,
  UserVerification,
} from "../utils/app-enumeration";
import { PUBLIC_AUTHORIZATION_TOKEN } from "../config/env.var";
import AppUser from "../model/app_user.model";
import RoleApiPermission from "../model/role-api-permission.model";
import RolePermission from "../model/role-permission.model";
import RolePermissionAccess from "../model/role-permission-access.model";

export const publicAuthentication: RequestHandler = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(BAD_REQUEST_CODE)
      .send(resBadRequest({ message: AUTHORIZATION_TOKEN_IS_REQUIRED }));
  }
  if (req.headers.authorization === "key") {
    return next();
  }
  return res.status(UNAUTHORIZED_ACCESS_CODE).send(resUnauthorizedAccess());
};

export const verifyAuthorizationToken = async (req: Request, res: Response) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(BAD_REQUEST_CODE)
        .send(resBadRequest({ message: AUTHORIZATION_TOKEN_IS_REQUIRED }));
    }
    const result = await verifyJWT(req.headers.authorization);
    if (result.code === DEFAULT_STATUS_CODE_SUCCESS) {
      return result.data;
    } else if (
      result.code === UNAUTHORIZED_ACCESS_CODE &&
      result.message === JWT_EXPIRED_ERROR_NAME
    ) {
      return res.status(result.code).send(result);
    }
    return res.status(DEFAULT_STATUS_CODE_ERROR).send(resUnknownError());
  } catch (e) {
    return res
      .status(DEFAULT_STATUS_CODE_ERROR)
      .send(resUnknownError({ data: e }));
  }
};

export const authentication: RequestHandler = async (req, res, next) => {
  const data = await verifyAuthorizationToken(req, res);
  if (!res.headersSent) {
    return next();
  }
};

export const adminAuthorization: RequestHandler = async (req, res, next) => {
  try {
    const data = await verifyAuthorizationToken(req, res);
    if (data.user_type !== UserType.Admin) {
      return res.status(UNAUTHORIZED_ACCESS_CODE).send(resUnauthorizedAccess());
    }

    if (req.body.session_res.id_role == 0) {
      return next();
    }
    const apiEndpoint = req.route.path;
    const method = getMethodFromRequest(req.method);

    if (method === 0) {
      return res
        .status(DEFAULT_STATUS_CODE_ERROR)
        .send(resUnauthorizedAccess({ data: HTTP_METHOD_NOT_FOUND }));
    }
    let resultRAP;
    if (apiEndpoint.includes(BASE_MASTER_URL)) {
      resultRAP = await RoleApiPermission.findOne({
        where: {
          http_method: method,
          api_endpoint: apiEndpoint,
          is_active: "1",
          master_type: req.params.master_type || req.body.master_type,
        },
      });
    } else {
      resultRAP = await RoleApiPermission.findOne({
        where: {
          http_method: method,
          api_endpoint: apiEndpoint,
          is_active: "1",
        },
      });
    }

    if (!(resultRAP && resultRAP.dataValues)) {
      return res
        .status(DEFAULT_STATUS_CODE_ERROR)
        .send(resUnauthorizedAccess({ data: ROLE_API_PERMISSION_NOT_FOUND }));
    }

    const rolePermission = await RolePermission.findOne({
      where: {
        id_role: req.body.session_res.id_role,
        id_menu_item: resultRAP.dataValues.id_menu_item,
        is_active: "1",
      },
      include: {
        model: RolePermissionAccess,
        as: "RPA",
        required: true,
        where: {
          id_action: resultRAP.dataValues.id_action,
          access: "1",
        },
      },
    });

    if (!(rolePermission && rolePermission.dataValues)) {
      return res
        .status(DEFAULT_STATUS_CODE_ERROR)
        .send(resUnauthorizedAccess());
    }

    return next();
  } catch (e) {

    return res
      .status(DEFAULT_STATUS_CODE_ERROR)
      .send(resUnknownError({ data: e }));
  }
};

export const customerAuthorization: RequestHandler = async (req, res, next) => {
  try {
    const data = await verifyAuthorizationToken(req, res);

    if (data.user_type === UserType.Customer) {
      const userVerify = await AppUser.findOne({
        where: {
          id: data.id,
          is_deleted: DeleteStatus.No,
          is_active: ActiveStatus.Active,
        },
      });
      if (
        userVerify?.dataValues.is_verified === UserVerification.Admin_Verified
      ) {
        req.body["session_res"] = {
          id: data.id,
          user_id: data.id,
          userType: UserType.Customer,
          id_role: data.id_role,
        };
        return next();
      } else {
        return res
          .status(UNAUTHORIZED_ACCESS_CODE)
          .send(resUnauthorizedAccess());
      }
    } else {
      return res.status(UNAUTHORIZED_ACCESS_CODE).send(resUnauthorizedAccess());
    }
  } catch (error) {
  }
};
export const userAuthorization: RequestHandler = async (req, res, next) => {
  const data = await verifyAuthorizationToken(req, res);
  if (data.user_type === UserType.Customer) {
    req.body["session_res"] = {
      user_id: data.id,
      userType: UserType.Customer,
      id_role: data.id_role,
    };
    return next();
  } else {
    return res.status(UNAUTHORIZED_ACCESS_CODE).send(resUnauthorizedAccess());
  }
};
export const tokenVerification: RequestHandler = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(BAD_REQUEST_CODE)
        .send(resBadRequest({ message: AUTHORIZATION_TOKEN_IS_REQUIRED }));
    }

    if (req.headers.authorization === PUBLIC_AUTHORIZATION_TOKEN) {
      req.body["session_res"] = {
        id: null,
        id_app_user: null,
        userType: UserType.Customer,
        id_role: null,
      };
    } else {
      const result = await verifyJWT(req.headers.authorization);

      if (result.code === DEFAULT_STATUS_CODE_SUCCESS) {
        if (!result.data.id) {
          return res
            .status(UNAUTHORIZED_ACCESS_CODE)
            .send(resUnauthorizedAccess());
        }
        req.body["session_res"] = {
          ...result.data,
          id_role: result.data.id_role,
          company_id: result.data.company_id,
        };
        req.body;
      } else {
        return res.status(result.code).send(result);
      }
    }
    return next();
  } catch (e) {
    return res
      .status(DEFAULT_STATUS_CODE_ERROR)
      .send(resUnknownError({ data: e }));
  }
};
