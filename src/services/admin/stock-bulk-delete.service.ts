import { Request } from "express";
import dbContext from "../../config/dbContext";
import { PRODUCT_CSV_FOLDER_PATH } from "../../config/env.var";
import { TResponseReturn } from "../../data/interfaces/common/common.interface";
import { moveFileToLocation } from "../../helpers/file-helper";
import Company from "../../model/companys.model";
import Diamonds from "../../model/diamond.model";
import Master from "../../model/masters.model";
import ProductBulkUploadFile from "../../model/product-bulk-upload-file.model";
import { PRODUCT_BULK_UPLOAD_FILE_MIMETYPE, PRODUCT_BULK_UPLOAD_FILE_SIZE } from "../../utils/app-constants";
import { FILE_STATUS, FILE_BULK_UPLOAD_TYPE, Master_type, DeleteStatus, StockStatus, ActiveStatus } from "../../utils/app-enumeration";
import { FILE_NOT_FOUND, PRODUCT_BULK_UPLOAD_FILE_MIMETYPE_ERROR_MESSAGE, PRODUCT_BULK_UPLOAD_FILE_SIZE_ERROR_MESSAGE, DEFAULT_STATUS_CODE_SUCCESS, ERROR_NOT_FOUND, INVALID_HEADER, REQUIRED_ERROR_MESSAGE } from "../../utils/app-messages";
import { resUnprocessableEntity, getLocalDate, resUnknownError, resSuccess, prepareMessageFromParams, refreshMaterializedViews} from "../../utils/shared-functions";
import { Op } from "sequelize";
const readXlsxFile = require("read-excel-file/node");

export const deleteStockCSVFile = async (req: Request) => {
    try {
        if (!req.file) {
            return resUnprocessableEntity({
                message: FILE_NOT_FOUND,
            });
        }

        if (req.file.mimetype !== PRODUCT_BULK_UPLOAD_FILE_MIMETYPE) {
            return resUnprocessableEntity({
                message: PRODUCT_BULK_UPLOAD_FILE_MIMETYPE_ERROR_MESSAGE,
            });
        }

        if (req.file.size > PRODUCT_BULK_UPLOAD_FILE_SIZE * 1024 * 1024) {
            return resUnprocessableEntity({
                message: PRODUCT_BULK_UPLOAD_FILE_SIZE_ERROR_MESSAGE,
            });
        }

        const resMFTL = moveFileToLocation(
            req.file.filename,
            req.file.destination,
            PRODUCT_CSV_FOLDER_PATH,
            req.file.originalname
        );

        if (resMFTL.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resMFTL;
        }

        const resPBUF = await ProductBulkUploadFile.create({
            file_path: resMFTL.data,
            status: FILE_STATUS.Uploaded,
            file_type: FILE_BULK_UPLOAD_TYPE.StockUpload,
            created_by: req.body.session_res.id_app_user,
            created_date: getLocalDate(),
        });

        const resPDBUF = await processStockBulkUploadFile(
            resPBUF.dataValues.id,
            resMFTL.data,
            req.body.session_res.id
        );

        return resPDBUF;
    } catch (e) {
        return resUnknownError({ data: e });
    }
};

const parseError = (error: any) => {
    let errorDetail = "";
    try {
        if (error) {
            if (error instanceof Error) {
                errorDetail = error.toString();
            } else {
                errorDetail = JSON.stringify(error);
            }
        }
    } catch (e) { }
    return errorDetail;
};

const processStockBulkUploadFile = async (
    id: number,
    path: string,
    idAppUser: number
) => {
    try {
        const data = await processCSVFile(path, idAppUser);

        if (data.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            await ProductBulkUploadFile.update(
                {
                    status: FILE_STATUS.ProcessedError,
                    error: JSON.stringify({
                        ...data,
                        data: parseError(data.data),
                    }),
                    modified_date: getLocalDate(),
                },
                { where: { id } }
            );
        } else {
            await ProductBulkUploadFile.update(
                {
                    status: FILE_STATUS.ProcessedSuccess,
                    modified_date: getLocalDate(),
                },
                { where: { id } }
            );
        }

        return data;
    } catch (e) {
        try {
            await ProductBulkUploadFile.update(
                {
                    status: FILE_STATUS.ProcessedError,
                    error: JSON.stringify(parseError(e)),
                    modified_date: getLocalDate(),
                },
                { where: { id } }
            );
        } catch (e) { }
    }
};

const processCSVFile = async (path: string, idAppUser: number) => {
    try {
        const resRows = await getArrayOfRowsFromCSVFile(path);
        if (resRows.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resRows;
        }

        const resVH = await validateHeaders(resRows.data.headers);
        if (resVH.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resVH;
        }

        //   if (resRows.data.batchSize > PRODUCT_BULK_UPLOAD_BATCH_SIZE) {
        //     return resUnprocessableEntity({
        //       message: PRODCUT_BULK_UPLOAD_BATCH_SIZE_ERROR_MESSAGE,
        //     });
        //   }

        const resProducts = await getStockFromRows(
            resRows.data.results,
            idAppUser
        );
        if (resProducts.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resProducts;
        }

        const resAPTD = await deleteGroupToDB(resProducts.data);
        if (resAPTD.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resAPTD;
        }

        return resSuccess({ data: resProducts.data });
    } catch (e) {
        throw e;
    }
};

const getArrayOfRowsFromCSVFile = async (path: string) => {
    return await new Promise<TResponseReturn>((resolve, reject) => {
        try {
            let results: any = [];
            let headerList: any = [];
            let batchSize = 0;

            readXlsxFile(path)
                .then((rows: any[]) => {
                    const row = rows[0];
                    const headers: string[] = [];
                    row.forEach((header: any) => {
                        headers.push(header);
                    });
                    headerList = headers;
                    rows.shift();

                    //Data
                    rows.forEach((row: any) => {
                        let data = {
                            "stock #": row[0],
                        };

                        batchSize++;
                        results.push(data);
                    });
                })
                .then(() => {
                    return resolve(
                        resSuccess({ data: { results, batchSize, headers: headerList } })
                    );
                });
        } catch (e) {
            return reject(e);
        }
    });
};

const validateHeaders = async (headers: string[]) => {
    const STOCK_BULK_UPLOAD_HEADERS = [
        "stock #",
    ];

    let errors: {
        row_id: number;
        column_id: number;
        column_name: string;
        error_message: string;
    }[] = [];
    let i;
    for (i = 0; i < headers.length; i++) {
        if (headers[i].trim() != STOCK_BULK_UPLOAD_HEADERS[i]) {
            errors.push({
                row_id: 1,
                column_id: i,
                column_name: headers[i],
                error_message: INVALID_HEADER,
            });
        }
    }

    if (errors.length > 0) {
        return resUnprocessableEntity({ data: errors });
    }
    return resSuccess();
};

const getStockFromRows = async (rows: any, idAppUser: any) => {
    let currentGroupIndex = -1;
    try {
        let errors: {
            row_id: number;
            error_message: string;
        }[] = [];
        const stockList = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                status: {
                    [Op.ne]: StockStatus.MEMO
                }
            },
        });

        let deleteStockList = [];
        for (const row of rows) {
            currentGroupIndex++;
            if (row["stock #"]) {

                const findStock = await stockList.find(
                    (t: any) => t.dataValues.stock_id == row["stock #"]
                );

                if (!(findStock && findStock.dataValues)) {
                    errors.push({
                        row_id: currentGroupIndex + 1,
                        error_message: prepareMessageFromParams(ERROR_NOT_FOUND,
                            [["field_name", `${row["stock #"]} is`]]
                        ),
                    });
                }

                if (findStock && findStock !== undefined && findStock != null) {
                    deleteStockList.push({
                        ...findStock.dataValues,
                        is_deleted: DeleteStatus.Yes,
                        deleted_by: idAppUser,
                        deleted_at: getLocalDate(),
                    });
                }
            }
        }

        if (errors.length > 0) {
            return resUnprocessableEntity({ data: errors });
        }

        return resSuccess({
            data: deleteStockList,
        });
    } catch (e) {
        throw e;
    }
};

const deleteGroupToDB = async (list: any) => {
    try {
        await Diamonds.bulkCreate(list, {
            updateOnDuplicate: ["is_deleted", "deleted_by", "deleted_at"],
        });
        await refreshMaterializedViews()

        return resSuccess({ data: list });
    } catch (e) {
        throw e;
    }
};