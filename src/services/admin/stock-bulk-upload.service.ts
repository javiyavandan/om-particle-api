import { Request } from "express";
import {
    getLocalDate,
    prepareMessageFromParams,
    refreshMaterializedDiamondListView,
    resBadRequest,
    resNotFound,
    resSuccess,
    resUnknownError,
    resUnprocessableEntity,
} from "../../utils/shared-functions";
import {
    PRODUCT_BULK_UPLOAD_FILE_MIMETYPE,
    PRODUCT_BULK_UPLOAD_FILE_SIZE,
} from "../../utils/app-constants";
import {
    DEFAULT_STATUS_CODE_SUCCESS,
    ERROR_NOT_FOUND,
    FILE_NOT_FOUND,
    INVALID_HEADER,
    PRODUCT_BULK_UPLOAD_FILE_MIMETYPE_ERROR_MESSAGE,
    PRODUCT_BULK_UPLOAD_FILE_SIZE_ERROR_MESSAGE,
    RECORD_DELETED,
    RECORD_UPDATE,
    REQUIRED_ERROR_MESSAGE,
} from "../../utils/app-messages";
import { moveFileToLocation } from "../../helpers/file-helper";
import { PRODUCT_CSV_FOLDER_PATH } from "../../config/env.var";
import ProductBulkUploadFile from "../../model/product-bulk-upload-file.model";
import {
    ActiveStatus,
    DeleteStatus,
    FILE_BULK_UPLOAD_TYPE,
    FILE_STATUS,
    Master_type,
    StockStatus,
} from "../../utils/app-enumeration";
import { TResponseReturn } from "../../data/interfaces/common/common.interface";
import Master from "../../model/masters.model";
import dbContext from "../../config/dbContext";
import Diamonds from "../../model/diamond.model";
import Company from "../../model/companys.model";
import { Op } from "sequelize";
const readXlsxFile = require("read-excel-file/node");

export const addStockCSVFile = async (req: Request) => {
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

        if (resRows.data.headers.length !== 27) {
            return resUnprocessableEntity()
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

        const resAPTD = await addGroupToDB(resProducts.data);
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
                            available: row[1],
                            shape: row[2],
                            quantity: row[3],
                            weight: row[4],
                            rate: row[5],
                            color: row[6],
                            "color intensity": row[7],
                            clarity: row[8],
                            video: row[9],
                            image: row[10],
                            certificate: row[11],
                            lab: row[12],
                            report: row[13],
                            polish: row[14],
                            symmetry: row[15],
                            "measurement height": row[16],
                            "measurement width": row[17],
                            "measurement depth": row[18],
                            "table %": row[19],
                            "depth %": row[20],
                            ratio: row[21],
                            fluorescence: row[22],
                            location: row[23],
                            "local location": row[24],
                            "user comment": row[25],
                            "admin comment": row[26],
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

const getIdFromName = (
    name: string,
    list: any,
    fieldName: string,
    field_name: any
) => {
    if ((name == "" && !name) || name == null) {
        return null;
    }

    let findItem = list.find(
        (item: any) =>
            item.dataValues[fieldName].trim().toLocaleLowerCase() ==
            name.toString().trim().toLocaleLowerCase()
    );

    return findItem
        ? { data: parseInt(findItem.dataValues.id), error: null }
        : {
            data: null,
            error: prepareMessageFromParams(ERROR_NOT_FOUND, [
                ["field_name", `${name} ${field_name}`],
            ]),
        };
};

const validateHeaders = async (headers: string[]) => {
    const STOCK_BULK_UPLOAD_HEADERS = [
        "stock #",
        "available",
        "shape",
        "quantity",
        "weight",
        "rate",
        "color",
        "color intensity",
        "clarity",
        "video",
        "image",
        "certificate",
        "lab",
        "report",
        "polish",
        "symmetry",
        "measurement height",
        "measurement width",
        "measurement depth",
        "table %",
        "depth %",
        "ratio",
        "fluorescence",
        "location",
        "local location",
        "user comment",
        "admin comment",
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
        const shapeList = await Master.findAll({
            where: {
                master_type: Master_type.Stone_shape,
                is_deleted: DeleteStatus.No,
            },
        });
        const colorList = await Master.findAll({
            where: {
                master_type: Master_type.Diamond_color,
                is_deleted: DeleteStatus.No,
            },
        });
        const clarityList = await Master.findAll({
            where: {
                master_type: Master_type.Diamond_clarity,
                is_deleted: DeleteStatus.No,
            },
        });
        const polishList = await Master.findAll({
            where: {
                master_type: Master_type.Polish,
                is_deleted: DeleteStatus.No,
            },
        });
        const SymmetryList = await Master.findAll({
            where: {
                master_type: Master_type.symmetry,
                is_deleted: DeleteStatus.No,
            },
        });
        const labList = await Master.findAll({
            where: {
                master_type: Master_type.lab,
                is_deleted: DeleteStatus.No,
            },
        });
        const fluorescenceList = await Master.findAll({
            where: {
                master_type: Master_type.fluorescence,
                is_deleted: DeleteStatus.No,
            },
        });
        const colorIntensityList = await Master.findAll({
            where: {
                master_type: Master_type.colorIntensity,
                is_deleted: DeleteStatus.No,
            },
        });
        const companyList = await Company.findAll({
            where: {
                is_deleted: DeleteStatus.No,
            },
        })
        const stockList = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
            },
        });

        let updatedStockList = [];
        let createdStockList = [];
        for (const row of rows) {
            currentGroupIndex++;
            if (row["stock #"]) {
                if (row.shape == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "shape"],
                        ]),
                    });
                }
                if (row.quantity == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "quantity"],
                        ]),
                    });
                }
                if (row.weight == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "Weight"],
                        ]),
                    });
                }
                if (row.rate == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "rate"],
                        ]),
                    });
                }
                if (row.color == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "color"],
                        ]),
                    });
                }
                if (row["color intensity"] == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "color intensity"],
                        ]),
                    });
                }
                if (row.clarity == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "Clarity"],
                        ]),
                    });
                }
                if (row.video == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "video"],
                        ]),
                    });
                }
                if (row.image == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "image"],
                        ]),
                    });
                }
                if (row.certificate == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "igi"],
                        ]),
                    });
                }
                if (row.lab == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "lab"],
                        ]),
                    });
                }
                if (row.report == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "report"],
                        ]),
                    });
                }
                if (row.polish == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "polish"],
                        ]),
                    });
                }
                if (row.symmetry == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "symmetry"],
                        ]),
                    });
                }
                if (row["measurement height"] == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "measurement height"],
                        ]),
                    });
                }
                if (row["measurement width"] == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "measurement width"],
                        ]),
                    });
                }
                if (row["measurement depth"] == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "measurement depth"],
                        ]),
                    });
                }
                if (row["table %"] == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "table %"],
                        ]),
                    });
                }
                if (row["depth %"] == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "depth %"],
                        ]),
                    });
                }
                if (row.ratio == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "ratio"],
                        ]),
                    });
                }
                if (row.location == null) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "location"],
                        ]),
                    });
                }

                let shape: any = getIdFromName(row.shape, shapeList, "name", "shape");
                if (shape && shape.error != undefined) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: shape.error,
                    });
                } else if (shape && shape.data) {
                    shape = shape?.data;
                } else {
                    shape = null;
                }

                let quantity: any = row.quantity;

                let weight: any = row["weight"];

                let rate: any = row.rate;

                let color: any = getIdFromName(row.color, colorList, "name", "color");
                if (color && color.error != undefined) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: color.error,
                    });
                } else if (color && color.data) {
                    color = color?.data;
                } else {
                    color = null;
                }

                let color_intensity: any = getIdFromName(row["color intensity"], colorIntensityList, "name", "color intensity");
                if (color_intensity && color_intensity.error != undefined) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: color_intensity.error,
                    });
                } else if (color_intensity && color_intensity.data) {
                    color_intensity = color_intensity?.data;
                } else {
                    color_intensity = null;
                }

                let clarity: any = getIdFromName(
                    row.clarity,
                    clarityList,
                    "name",
                    "clarity"
                );
                if (clarity && clarity.error != undefined) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: clarity.error,
                    });
                } else if (clarity && clarity.data) {
                    clarity = clarity?.data;
                } else {
                    clarity = null;
                }

                let video: any = row.video;
                let image: any = row.image;
                let certificate: any = row.certificate;

                let lab: any = getIdFromName(row.lab, labList, "name", "lab");
                if (lab && lab.error != undefined) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: lab.error,
                    });
                } else if (lab && lab.data) {
                    lab = lab?.data;
                } else {
                    lab = null;
                }

                let report: any = row.report;

                let polish: any = getIdFromName(
                    row["polish"],
                    polishList,
                    "name",
                    "polish"
                );
                if (polish && polish.error != undefined) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: polish.error,
                    });
                } else if (polish && polish.data) {
                    polish = polish?.data;
                } else {
                    polish = null;
                }

                let symmetry: any = getIdFromName(
                    row["symmetry"],
                    SymmetryList,
                    "name",
                    "Symmetry"
                );

                if (symmetry && symmetry.error != undefined) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: symmetry.error,
                    });
                } else if (symmetry && symmetry.data) {
                    symmetry = symmetry?.data;
                } else {
                    symmetry = null;
                }

                let measurement_height: any = row["measurement height"];
                let measurement_width: any = row["measurement width"];
                let measurement_depth: any = row["measurement depth"];
                let table_per: any = row["table %"];
                let depth_per: any = row["depth %"];
                let ratio: any = row.ratio;

                let fluorescence: any;
                if (row.fluorescence != null && row.fluorescence !== "NONE") {
                    fluorescence = getIdFromName(
                        row.fluorescence,
                        fluorescenceList,
                        "name",
                        "Fluorescence Intensity"
                    );
                    if (
                        fluorescence &&
                        fluorescence.error != undefined
                    ) {
                        errors.push({
                            row_id: currentGroupIndex + 1 + 1,
                            error_message: fluorescence.error,
                        });
                    } else if (fluorescence && fluorescence.data) {
                        fluorescence = fluorescence?.data;
                    } else {
                        fluorescence = null;
                    }


                }

                let company: any = getIdFromName(
                    row.location,
                    companyList,
                    "name",
                    "location"
                );
                if (
                    company &&
                    company.error != undefined
                ) {
                    errors.push({
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: company.error,
                    });
                } else if (company && company.data) {
                    company = company?.data;
                } else {
                    company = null;
                }

                let local_location: any = row["local location"];
                let user_comments: any = row["user comments"];
                let admin_comments: any = row["admin comments"];

                const findStock = await stockList.find(
                    (t: any) => t.dataValues.stock_id == row["stock #"]
                );


                if (findStock && findStock !== undefined && findStock != null) {
                    updatedStockList.push({
                        id: findStock.dataValues.id,
                        stock_id: row["stock #"],
                        shape,
                        quantity,
                        weight,
                        rate,
                        color,
                        color_intensity,
                        clarity,
                        video,
                        image,
                        certificate,
                        lab,
                        report,
                        polish,
                        symmetry,
                        measurement_height,
                        measurement_width,
                        measurement_depth,
                        table_value: table_per,
                        depth_value: depth_per,
                        ratio,
                        fluorescence,
                        company_id: company,
                        local_location,
                        user_comments,
                        admin_comments,
                        status: StockStatus.AVAILABLE,
                        modified_by: idAppUser,
                        modified_at: getLocalDate(),
                        created_at: getLocalDate(),
                        created_by: idAppUser,
                    });
                } else {
                    createdStockList.push({
                        stock_id: row["stock #"],
                        shape,
                        quantity,
                        weight,
                        rate,
                        color,
                        color_intensity,
                        clarity,
                        video,
                        image,
                        certificate,
                        lab,
                        report,
                        polish,
                        symmetry,
                        measurement_height,
                        measurement_width,
                        measurement_depth,
                        table_value: table_per,
                        depth_value: depth_per,
                        ratio,
                        fluorescence,
                        company_id: company,
                        local_location,
                        user_comments,
                        admin_comments,
                        status: StockStatus.AVAILABLE,
                        is_active: ActiveStatus.Active,
                        is_deleted: DeleteStatus.No,
                        created_by: idAppUser,
                        created_at: getLocalDate(),
                    });
                }
            }
        }

        if (errors.length > 0) {
            return resUnprocessableEntity({ data: errors });
        }

        return resSuccess({
            data: { create: createdStockList, update: updatedStockList },
        });
    } catch (e) {
        throw e;
    }
};

const addGroupToDB = async (list: any) => {
    const trn = await dbContext.transaction();
    try {
        if (list.create.length > 0) {
            await Diamonds.bulkCreate(list.create, {
                transaction: trn,
            });
        }

        if (list.update.length > 0) {
            await Diamonds.bulkCreate(list.update, {
                transaction: trn,
                updateOnDuplicate: [
                    "stock_id",
                    "shape",
                    "quantity",
                    "weight",
                    "rate",
                    "color",
                    "color_intensity",
                    "clarity",
                    "video",
                    "image",
                    "certificate",
                    "lab",
                    "report",
                    "polish",
                    "symmetry",
                    "measurement_height",
                    "measurement_width",
                    "measurement_depth",
                    "table_value",
                    "depth_value",
                    "ratio",
                    "fluorescence",
                    "company_id",
                    "local_location",
                    "user_comments",
                    "admin_comments",
                    "status",
                    "modified_by",
                    "modified_at",
                ],
            });
        }
        await trn.commit();
        await refreshMaterializedDiamondListView()

        return resSuccess({ data: list });
    } catch (e) {
        await trn.rollback();
        throw e;
    }
};

export const updateBulkStockStatus = async (req: Request) => {
    const { stock_id, status } = req.body
    try {
        const error = [];

        const stock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No
            }
        });

        if (stock_id.length > 0) {
            for (let index = 0; index < stock_id.length; index++) {
                const number = stock_id[index];
                const findStock = stock.find((data) => {
                    return data.dataValues.stock_id === number
                })

                if (!(findStock && findStock.dataValues)) {
                    error.push(`${number} stock not found`)
                }
            }
        }

        if (error.length > 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]]),
                data: error.map(err => err)
            })
        }

        const updatedStockList = [];
        for (let index = 0; index < stock_id.length; index++) {
            const number = stock_id[index];
            const findStock = stock.find((stock) => stock.dataValues.stock_id == number);
            if (findStock && findStock.dataValues) {
                updatedStockList.push({
                    ...findStock.dataValues,
                    is_active: status,
                    modified_at: getLocalDate(),
                    modified_by: req.body.session_res.id,
                });
            }
        }

        if (updatedStockList.length > 0) {
            await Diamonds.bulkCreate(updatedStockList, {
                updateOnDuplicate: ["is_active", "modified_by", "modified_at"],
            })
        }
        await refreshMaterializedDiamondListView()

        return resSuccess({ message: RECORD_UPDATE })


    } catch (error) {
        throw error;
    }

}

export const deleteBulkStock = async (req: Request) => {
    const { stock_id } = req.params
    try {
        const stockList = stock_id.split(",");

        const error = [];

        const stock = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                status: {
                    [Op.ne]: StockStatus.MEMO
                }
            }
        });

        if (stockList.length > 0) {
            for (let index = 0; index < stockList.length; index++) {
                const number = stockList[index];
                const findStock = stock.find((data) => {
                    return data.dataValues.stock_id === number
                })

                if (!(findStock && findStock.dataValues)) {
                    error.push(`${number} stock not found`)
                }
            }
        }

        if (error.length > 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Stock"]]),
                data: error.map(err => err)
            })
        }

        const updatedStockList = [];
        for (let index = 0; index < stockList.length; index++) {
            const number = stockList[index];
            const findStock = stock.find((stock) => stock.dataValues.stock_id == number);
            if (findStock && findStock.dataValues) {
                updatedStockList.push({
                    ...findStock.dataValues,
                    is_deleted: DeleteStatus.Yes,
                    deleted_at: getLocalDate(),
                    deleted_by: req.body.session_res.id,
                });
            }
        }

        if (updatedStockList.length > 0) {
            await Diamonds.bulkCreate(updatedStockList, {
                updateOnDuplicate: ["is_deleted", "deleted_by", "deleted_at"],
            })
        }
        await refreshMaterializedDiamondListView()

        return resSuccess({ message: RECORD_DELETED })


    } catch (error) {
        throw error;
    }

}