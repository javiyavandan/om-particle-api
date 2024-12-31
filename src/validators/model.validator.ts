import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import {
  BAD_REQUEST_CODE,
  BAD_REQUEST_MESSAGE,
  DEFAULT_STATUS_ERROR,
} from "../utils/app-messages";

export default async (
  req: Request,
  res: Response,
  next: NextFunction,
  validations: ValidationChain[],
  onlyFirstError: boolean = true
) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const data = {
    status: DEFAULT_STATUS_ERROR,
    code: BAD_REQUEST_CODE,
    message: BAD_REQUEST_MESSAGE,
    data: errors.array({ onlyFirstError }),
  };

  return res.status(BAD_REQUEST_CODE).send(data);
};
