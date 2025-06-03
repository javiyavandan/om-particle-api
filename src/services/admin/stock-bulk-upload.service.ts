import { Request } from "express";
import {
    getLocalDate,
    prepareMessageFromParams,
    refreshMaterializedViews,
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
    APiStockStatus,
    DeleteStatus,
    FILE_BULK_UPLOAD_TYPE,
    FILE_STATUS,
    Is_loose_diamond,
    Log_action_type,
    Log_Type,
    Master_type,
    StockStatus,
} from "../../utils/app-enumeration";
import { TResponseReturn } from "../../data/interfaces/common/common.interface";
import Master from "../../model/masters.model";
import dbContext from "../../config/dbContext";
import Diamonds from "../../model/diamond.model";
import Company from "../../model/companys.model";
import { Op } from "sequelize";
import Apis from "../../model/apis";
import ApiStockDetails from "../../model/api-stock-details";
import AppUser from "../../model/app_user.model";
import StockLogs from "../../model/stock-logs.model";
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

        if (resRows.data.headers.length !== 28) {
            return resUnprocessableEntity()
        }

        const resVH = await validateHeaders(resRows.data.headers);
        if (resVH.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resVH;
        }
        const resProducts = await getStockFromRows(
            resRows.data.results,
            idAppUser
        );
        if (resProducts.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resProducts;
        }

        const resAPTD = await addGroupToDB(resProducts.data, idAppUser);
        if (resAPTD.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resAPTD;
        }

        return resSuccess({ data: resProducts.data });
    } catch (e) {
        throw e;
    }
};

const getArrayOfRowsFromCSVFile = async (path: string) => {
    try {
        const rows = await readXlsxFile(path);
        const headers = rows.shift();
        const results = rows.map((row: { [x: string]: any; }) => {
            const acc: { [x: string]: any; } = {};
            for (let index = 0; index < headers.length; index++) {
                const header = headers[index];
                acc[header] = row[index];
            }
            return acc;
        });

        return resSuccess({ data: { headers, results } });
    } catch (e) {
        return resUnknownError({ data: e });
    }
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
        "shape",
        "quantity",
        "weight",
        "rate",
        "color",
        "color intensity",
        "color over tone",
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
        "loose diamond"
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
            stock_id: string;
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

        const updateStockLogs = [];
        const newStockLog = [];
        const getNameFromId = (list: any[], id: any) => list.find((item: any) => item.dataValues.id == id)?.dataValues?.name;

        const seenStockNumbers = new Set<string>();
        for (const row of rows) {
            currentGroupIndex++;
            const stockNumber = row["stock #"];
            if (stockNumber) {
                if (seenStockNumbers.has(stockNumber)) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: "Duplicate stock number",
                    });
                }
                seenStockNumbers.add(stockNumber);
                if (row.shape == null) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "shape"],
                        ]),
                    });
                }
                if (row.weight == null) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "Weight"],
                        ]),
                    });
                }
                if (row.rate == null) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "rate"],
                        ]),
                    });
                }
                if (row.color == null) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "color"],
                        ]),
                    });
                }
                if (row.location == null) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "location"],
                        ]),
                    });
                }
                if (row["loose diamond"] == null) {
                    row["loose diamond"] = Is_loose_diamond.No
                }

                let shape: any;

                if (row.shape?.trim().toLocaleLowerCase()?.includes("other")) {
                    shape = getIdFromName("other", shapeList, "name", "shape");
                } else {
                    shape = getIdFromName(row.shape, shapeList, "name", "shape");
                }

                if (shape && shape.error != undefined) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: shape.error,
                    });
                } else if (shape && shape.data) {
                    shape = shape?.data;
                } else {
                    shape = null;
                }

                let quantity: any = row.quantity ?? 1;


                let weight: any = row["weight"];

                let rate: any = row.rate;


                let color: any;

                if (row.color?.trim().toLocaleLowerCase()?.includes("other")) {
                    color = getIdFromName("other", colorList, "name", "color");
                } else {
                    color = getIdFromName(row.color, colorList, "name", "color");
                }

                if (color && color.error != undefined) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: color.error,
                    });
                } else if (color && color.data) {
                    color = color?.data;
                } else {
                    color = null;
                }

                let color_intensity: any;
                if (row["color intensity"]) {
                    color_intensity = getIdFromName(row["color intensity"], colorIntensityList, "name", "color intensity");
                    if (color_intensity && color_intensity.error != undefined) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 1 + 1,
                            error_message: color_intensity.error,
                        });
                    } else if (color_intensity && color_intensity.data) {
                        color_intensity = color_intensity?.data;
                    } else {
                        color_intensity = null;
                    }
                }

                let color_over_tone: any = row["color over tone"];

                let clarity: any;
                if (row.clarity) {
                    clarity = getIdFromName(
                        row.clarity,
                        clarityList,
                        "name",
                        "clarity"
                    );
                    if (clarity && clarity.error != undefined) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 1 + 1,
                            error_message: clarity.error,
                        });
                    } else if (clarity && clarity.data) {
                        clarity = clarity?.data;
                    } else {
                        clarity = null;
                    }
                }

                let video: any = row.video;
                let image: any = row.image;
                let certificate: any = row.certificate;

                let lab: any;
                if (row.lab) {
                    lab = getIdFromName(row.lab, labList, "name", "lab");
                    if (lab && lab.error != undefined) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 1 + 1,
                            error_message: lab.error,
                        });
                    } else if (lab && lab.data) {
                        lab = lab?.data;
                    } else {
                        lab = null;
                    }
                }

                let report: any = row.report;

                let polish: any;
                if (row.polish) {
                    polish = getIdFromName(
                        row["polish"],
                        polishList,
                        "name",
                        "polish"
                    );
                    if (polish && polish.error != undefined) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 1 + 1,
                            error_message: polish.error,
                        });
                    } else if (polish && polish.data) {
                        polish = polish?.data;
                    } else {
                        polish = null;
                    }
                }

                let symmetry: any;
                if (row.symmetry) {
                    symmetry = getIdFromName(
                        row["symmetry"],
                        SymmetryList,
                        "name",
                        "Symmetry"
                    );
                    if (symmetry && symmetry.error != undefined) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 1 + 1,
                            error_message: symmetry.error,
                        });
                    } else if (symmetry && symmetry.data) {
                        symmetry = symmetry?.data;
                    } else {
                        symmetry = null;
                    }
                }

                let measurement_height: any = row["measurement height"];
                let measurement_width: any = row["measurement width"];
                let measurement_depth: any = row["measurement depth"];
                let table_per: any = row["table %"];
                let depth_per: any = row["depth %"];
                let ratio: any = row.ratio;

                let fluorescence: any;
                if (row.fluorescence != null) {
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
                            stock_id: row["stock #"],
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
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: company.error,
                    });
                } else if (company && company.data) {
                    company = company?.data;
                } else {
                    company = null;
                }

                let local_location: any = row["local location"];
                let user_comments: any = row["user comment"];
                let admin_comments: any = row["admin comment"];
                let loose_diamond: any = row["loose diamond"].charAt(0).toUpperCase() + row["loose diamond"].slice(1).toLowerCase();
                if (!(Object.values(Is_loose_diamond).includes(loose_diamond))) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: `Loose Diamond value ${loose_diamond} is not valid. Valid values are ${Object.values(Is_loose_diamond).join("and ")}.`,
                    });
                }

                const findStock = await stockList.find(
                    (t: any) => t.dataValues.stock_id == row["stock #"]
                );

                if (findStock && findStock !== undefined && findStock != null) {
                    const updatedFields: any = {};
                    const original = findStock.dataValues;

                    function shouldInclude(oldVal: any, newVal: null) {
                        const isNullOrUndef = (val: null | undefined) => val === null || val === undefined;

                        if (isNullOrUndef(oldVal) && isNullOrUndef(newVal)) {
                            return false;
                        }

                        if (newVal === null) {
                            return true;
                        }

                        return String(oldVal) !== String(newVal);
                    }

                    const fieldsToCheck = [
                        "quantity",
                        "remain_quantity",
                        "weight",
                        "rate",
                        "color",
                        "color_intensity",
                        "color_over_tone",
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
                        "loose_diamond"
                    ];


                    const oldValues: any = {
                        quantity: original.quantity,
                        remain_quantity: original.remain_quantity,
                        weight: original.weight,
                        shape: getNameFromId(shapeList, original.shape),
                        rate: original.rate,
                        color: getNameFromId(colorList, original.color),
                        color_intensity: original.color_intensity ? getNameFromId(colorIntensityList, original.color_intensity) : null,
                        color_over_tone: original.color_over_tone,
                        clarity: original.clarity ? getNameFromId(clarityList, original.clarity) : null,
                        video: original.video,
                        image: original.image,
                        certificate: original.certificate,
                        lab: original.lab ? getNameFromId(labList, original.lab) : null,
                        report: original.report,
                        polish: original.polish ? getNameFromId(polishList, original.polish) : null,
                        symmetry: original.symmetry ? getNameFromId(SymmetryList, original.symmetry) : null,
                        measurement_height: original.measurement_height,
                        measurement_width: original.measurement_width,
                        measurement_depth: original.measurement_depth,
                        table_value: original.table_value,
                        depth_value: original.depth_value,
                        ratio: original.ratio,
                        fluorescence: original.fluorescence ? getNameFromId(fluorescenceList, original.fluorescence) : null,
                        company_id: original.company_id ? getNameFromId(companyList, original.company_id) : null,
                        local_location: original.local_location,
                        user_comments: original.user_comments,
                        admin_comments: original.admin_comments,
                        loose_diamond: original.loose_diamond
                    }

                    const currentValues: any = {
                        quantity:
                            quantity != original.remain_quantity
                                ? Number(original.quantity) + Number(quantity) - Number(original.remain_quantity)
                                : original.quantity,
                        remain_quantity: quantity,
                        shape: row.shape,
                        weight,
                        rate,
                        color: row.color,
                        color_intensity: row["color intensity"],
                        color_over_tone: row["color over tone"],
                        clarity: row.clarity,
                        video,
                        image,
                        certificate,
                        lab: row.lab,
                        report,
                        polish: row.polish,
                        symmetry: row.symmetry,
                        measurement_height,
                        measurement_width,
                        measurement_depth,
                        table_value: table_per,
                        depth_value: depth_per,
                        ratio,
                        fluorescence: row.fluorescence,
                        company_id: row["location"],
                        local_location,
                        user_comments,
                        admin_comments,
                        loose_diamond
                    };

                    for (const field of fieldsToCheck) {
                        const oldVal = oldValues[field];
                        const newVal = currentValues[field];

                        if (shouldInclude(oldVal, newVal)) {
                            updatedFields[field] = {
                                old: oldVal,
                                new: newVal
                            };
                        }
                    }

                    if (Object.keys(updatedFields).length > 0) {
                        updateStockLogs.push({
                            reference_id: original.id,
                            stock_id: row["stock #"],
                            updated_fields: updatedFields
                        });
                    }

                    updatedStockList.push({
                        id: findStock.dataValues.id,
                        stock_id: row["stock #"],
                        shape,
                        quantity: quantity !=
                            findStock.dataValues.remain_quantity
                            ? Number(findStock.dataValues.quantity) +
                            Number(quantity) -
                            Number(findStock.dataValues.remain_quantity)
                            : findStock.dataValues.quantity,
                        remain_quantity: quantity,
                        weight,
                        rate,
                        color,
                        color_intensity,
                        color_over_tone,
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
                        loose_diamond,
                        status: findStock.dataValues.status,
                        modified_by: idAppUser,
                        modified_at: getLocalDate(),
                        created_at: getLocalDate(),
                        created_by: idAppUser,
                    });
                } else {
                    newStockLog.push({
                        stock_id: row["stock #"],
                        shape: getNameFromId(shapeList, shape),
                        quantity,
                        weight,
                        rate,
                        color: getNameFromId(colorList, color),
                        color_intensity: color_intensity ? getNameFromId(colorIntensityList, color_intensity) : null,
                        color_over_tone,
                        clarity: clarity ? getNameFromId(clarityList, clarity) : null,
                        video,
                        image,
                        certificate,
                        lab: lab ? getNameFromId(labList, lab) : null,
                        report,
                        polish: polish ? getNameFromId(polishList, polish) : null,
                        symmetry: symmetry ? getNameFromId(SymmetryList, symmetry) : null,
                        measurement_height,
                        measurement_width,
                        measurement_depth,
                        table_value: table_per,
                        depth_value: depth_per,
                        ratio,
                        fluorescence: fluorescence ? getNameFromId(fluorescenceList, fluorescence) : null,
                        company_id: company ? getNameFromId(companyList, company) : null,
                        local_location,
                        user_comments,
                        admin_comments,
                        loose_diamond,
                        remain_quantity: quantity,
                    })
                    createdStockList.push({
                        stock_id: row["stock #"],
                        shape,
                        quantity,
                        weight,
                        rate,
                        color,
                        color_intensity,
                        color_over_tone,
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
                        loose_diamond,
                        remain_quantity: quantity,
                        status: StockStatus.AVAILABLE,
                        is_active: ActiveStatus.Active,
                        is_deleted: DeleteStatus.No,
                        created_by: idAppUser,
                        created_at: getLocalDate(),
                    });
                }
            } else {
                errors.push({
                    stock_id: "",
                    row_id: currentGroupIndex + 1 + 1,
                    error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                        ["field_name", "Stock #"],
                    ]),
                });
            }
        }
        if (errors.length > 0) {
            return resUnprocessableEntity({ data: errors });
        }

        return resSuccess({
            data: { create: createdStockList, update: updatedStockList, updateStockLogs, newStockLog },
        });
    } catch (e) {
        throw e;
    }
};

const addGroupToDB = async (list: any, idAppUser: any) => {
    let trn;
    try {
        const admin = await AppUser.findOne({
            where: {
                id: idAppUser,
                is_deleted: DeleteStatus.No,
                is_active: ActiveStatus.Active
            },
            attributes: ["first_name", "last_name", "id"],
        })

        const api = await Apis.findAll({
            where: {
                is_deleted: DeleteStatus.No,
            },
            include: [
                {
                    model: ApiStockDetails,
                    as: "api_detail"
                }
            ]
        })

        let apiDetail = [];
        const newStockLogs = [];

        trn = await dbContext.transaction();

        if (list.create.length > 0) {
            const create = await Diamonds.bulkCreate(list.create, {
                transaction: trn,
            });
            for (let i = 0; i < create.length; i++) {
                const stock = create[i];
                if (list?.newStockLog?.some((item: any) => item?.stock_id == stock?.dataValues?.stock_id)) {
                    newStockLogs.push({
                        ...list?.newStockLog?.find((item: any) => item?.stock_id == stock?.dataValues?.stock_id),
                        reference_id: stock?.dataValues?.id
                    })
                }
                if (stock?.dataValues?.certificate != null && stock?.dataValues?.certificate != undefined && stock?.dataValues?.certificate != '' && stock?.dataValues?.report != null) {
                    const findApi = api.filter((item) => item.dataValues?.company_id === stock?.dataValues?.company_id)
                    if (findApi?.length > 0) {
                        for (let j = 0; j < findApi.length; j++) {
                            const apiData = findApi[j];
                            apiDetail.push({
                                api_id: apiData?.dataValues?.id,
                                stock_id: stock?.dataValues?.id,
                                price: stock?.dataValues?.rate,
                                status: APiStockStatus.SELECTED
                            });
                        }
                    }
                }
            }
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
                    "color_over_tone",
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
                    "loose_diamond",
                    "modified_by",
                    "modified_at",
                    "remain_quantity",
                ],
            });

            for (let i = 0; i < list.update.length; i++) {
                const stock = list.update[i];
                const findApi = api.filter((item) => item.dataValues?.company_id === stock?.dataValues?.company_id)
                if (stock?.dataValues?.certificate != null && stock?.dataValues?.certificate != undefined && stock?.dataValues?.certificate != '' && stock?.dataValues?.report != null && findApi?.length > 0) {
                    for (let j = 0; j < findApi.length; j++) {
                        const apiData = findApi[j];
                        const apiDetailList = apiData?.dataValues?.api_detail?.some((item: any) => item.stock_id === stock?.dataValues?.id);
                        if (!apiDetailList) {
                            apiDetail.push({
                                api_id: apiData?.dataValues?.id,
                                stock_id: stock?.dataValues?.id,
                                price: stock?.dataValues?.rate,
                                status: APiStockStatus.SELECTED
                            });
                        }
                    }
                }
            }
        }

        if (list.updateStockLogs.length > 0) {
            const updateLogs = [];
            for (const log of list.updateStockLogs) {
                updateLogs.push({
                    reference_id: log.reference_id,
                    change_at: getLocalDate(),
                    change_by: ((admin?.dataValues?.first_name ?? "") + " " + (admin?.dataValues?.last_name ?? "")),
                    change_by_id: admin?.dataValues?.id,
                    description: JSON.stringify(log.updated_fields),
                    log_type: Log_Type.Stock,
                    action_type: Log_action_type.EDIT,
                })
            }
            await StockLogs.bulkCreate(updateLogs, {
                transaction: trn,
            });
        }

        if (newStockLogs?.length > 0) {
            const newLogs = [];
            for (const log of newStockLogs) {
                newLogs.push({
                    reference_id: log.reference_id,
                    change_at: getLocalDate(),
                    change_by: ((admin?.dataValues?.first_name ?? "") + " " + (admin?.dataValues?.last_name ?? "")),
                    change_by_id: admin?.dataValues?.id,
                    description: JSON.stringify(log),
                    log_type: Log_Type.Stock,
                    action_type: Log_action_type.ADD,
                })
            }
            await StockLogs.bulkCreate(newLogs, {
                transaction: trn,
            });
        }

        if (apiDetail?.length > 0) {
            await ApiStockDetails.bulkCreate(apiDetail, {
                transaction: trn,
            });
        }

        await trn.commit();
        await refreshMaterializedViews()

        return resSuccess({ data: list });
    } catch (e) {
        console.log(e)
        if (trn) {
            await trn.rollback();
        }
        throw e;
    }
};

export const updateBulkStockStatus = async (req: Request) => {
    let trn;
    try {
        const { stock_id, status } = req.body
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

        const admin = await AppUser.findOne({
            where: {
                id_role: req.body.session_res.id_role,
                is_deleted: DeleteStatus.No,
                id: req.body.session_res.id,
                is_active: ActiveStatus.Active
            },
            attributes: ["id", "first_name"]
        })

        const updatedStockList = [];
        const stockLogs = [];

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
                stockLogs.push({
                    reference_id: number,
                    change_at: getLocalDate(),
                    change_by: ((admin?.dataValues?.first_name ?? "") + " " + (admin?.dataValues?.last_name ?? "")),
                    change_by_id: admin?.dataValues?.id,
                    description: JSON.stringify({
                        stock_status: { old: findStock.dataValues?.is_active === ActiveStatus.Active ? "Enabled" : "Disabled", new: status === ActiveStatus.Active ? "Enabled" : "Disabled" }
                    }),
                    log_type: Log_Type.Stock,
                    action_type: Log_action_type.EDIT
                })
            }
        }

        trn = await dbContext.transaction();

        if (updatedStockList.length > 0) {
            await Diamonds.bulkCreate(updatedStockList, {
                updateOnDuplicate: ["is_active", "modified_by", "modified_at"],
                transaction: trn,
            })
        }

        if (stockLogs.length > 0) {
            await StockLogs.bulkCreate(stockLogs, {
                transaction: trn
            })
        }

        await trn.commit();
        await refreshMaterializedViews()

        return resSuccess({ message: RECORD_UPDATE })


    } catch (error) {
        if (trn) {
            await trn.rollback();
        }
        throw error;
    }

}

export const deleteBulkStock = async (req: Request) => {
    let trn;
    try {
        const { stock_id } = req.params
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

        const admin = await AppUser.findOne({
            where: {
                id_role: req.body.session_res.id_role,
                is_deleted: DeleteStatus.No,
                id: req.body.session_res.id,
                is_active: ActiveStatus.Active
            },
            attributes: ["id", "first_name"]
        })

        const updatedStockList = [];
        const stockLogs = [];

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
                stockLogs.push({
                    reference_id: number,
                    change_at: getLocalDate(),
                    change_by: ((admin?.dataValues?.first_name ?? "") + " " + (admin?.dataValues?.last_name ?? "")),
                    change_by_id: admin?.dataValues?.id,
                    description: `${findStock.dataValues.stock_id} stock deleted`,
                    log_type: Log_Type.Stock,
                    action_type: Log_action_type.DELETE
                })
            }
        }

        trn = await dbContext.transaction();

        if (updatedStockList.length > 0) {
            await Diamonds.bulkCreate(updatedStockList, {
                updateOnDuplicate: ["is_deleted", "deleted_by", "deleted_at"],
                transaction: trn,
            })
        }

        if (stockLogs?.length > 0) {
            await StockLogs.bulkCreate(stockLogs, {
                transaction: trn
            })
        }

        await trn.commit();
        await refreshMaterializedViews()

        return resSuccess({ message: RECORD_DELETED })


    } catch (error) {
        if (trn) {
            await trn.rollback();
        }
        throw error;
    }

}