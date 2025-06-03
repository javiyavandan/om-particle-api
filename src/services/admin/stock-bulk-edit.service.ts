import e, { Request } from "express";
import { getLocalDate, prepareMessageFromParams, refreshMaterializedViews, resBadRequest, resNotFound, resSuccess, resUnknownError, resUnprocessableEntity } from "../../utils/shared-functions";
import { DEFAULT_STATUS_CODE_SUCCESS, ERROR_NOT_FOUND, INVALID_HEADER, PRODUCT_BULK_UPLOAD_FILE_MIMETYPE_ERROR_MESSAGE, PRODUCT_BULK_UPLOAD_FILE_SIZE_ERROR_MESSAGE, REQUIRED_ERROR_MESSAGE } from "../../utils/app-messages";
import { PRODUCT_BULK_UPLOAD_FILE_MIMETYPE, PRODUCT_BULK_UPLOAD_FILE_SIZE } from "../../utils/app-constants";
import { PRODUCT_CSV_FOLDER_PATH } from "../../config/env.var";
import { moveFileToLocation } from "../../helpers/file-helper";
import ProductBulkUploadFile from "../../model/product-bulk-upload-file.model";
import { ActiveStatus, APiStockStatus, DeleteStatus, FILE_BULK_UPLOAD_TYPE, FILE_STATUS, Is_loose_diamond, Log_action_type, Log_Type, Master_type } from "../../utils/app-enumeration";
import Master from "../../model/masters.model";
import Company from "../../model/companys.model";
import Diamonds from "../../model/diamond.model";
import Apis from "../../model/apis";
import ApiStockDetails from "../../model/api-stock-details";
import dbContext from "../../config/dbContext";
import StockLogs from "../../model/stock-logs.model";
import AppUser from "../../model/app_user.model";
const readXlsxFile = require("read-excel-file/node");

export const editStockCSVFile = async (req: Request) => {
    try {
        const { file } = req

        if (!file) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "File"]])
            })
        }

        if (file.mimetype !== PRODUCT_BULK_UPLOAD_FILE_MIMETYPE) {
            return resUnprocessableEntity({
                message: PRODUCT_BULK_UPLOAD_FILE_MIMETYPE_ERROR_MESSAGE
            })
        }

        if (file.size > PRODUCT_BULK_UPLOAD_FILE_SIZE * 1024 * 1024) {
            return resUnprocessableEntity({
                message: PRODUCT_BULK_UPLOAD_FILE_SIZE_ERROR_MESSAGE
            })
        }

        const resMFTL = moveFileToLocation(
            file.filename,
            file.destination,
            PRODUCT_CSV_FOLDER_PATH,
            file.originalname
        );

        if (resMFTL.code !== DEFAULT_STATUS_CODE_SUCCESS) {
            return resMFTL;
        }

        const resPBUF = await ProductBulkUploadFile.create({
            file_path: resMFTL.data,
            status: FILE_STATUS.Uploaded,
            file_type: FILE_BULK_UPLOAD_TYPE.StockUpload,
            modified_by: req.body.session_res.id,
            modified_date: getLocalDate(),
        })

        const resPDBUF = await processStockBulkUploadFile(
            resPBUF.dataValues.id,
            resMFTL.data,
            req.body.session_res.id
        );

        return resPDBUF;
    } catch (error) {
        return resUnknownError({ data: error })
    }
}

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
        if (resRows.code !== DEFAULT_STATUS_CODE_SUCCESS) return resRows;

        if (resRows.data.headers.length < 1) {
            return resUnprocessableEntity()
        }

        const resVH = await validateHeaders(resRows.data.headers);
        if (resVH.code !== DEFAULT_STATUS_CODE_SUCCESS) return resVH;

        const resProducts = await getStockFromRows(
            resRows.data.headers,
            resRows.data.results,
            idAppUser
        )
        if (resProducts.code !== DEFAULT_STATUS_CODE_SUCCESS) return resProducts;

        const resUTDB = await updateToDb(resProducts.data, resRows.data.headers, idAppUser);
        if (resUTDB.code !== DEFAULT_STATUS_CODE_SUCCESS) return resUTDB;

        return resSuccess({
            data: resProducts.data
        });
    } catch (error) {
        return resUnknownError({ data: error })
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
    for (let i = 0; i < headers.length; i++) {
        if (i === 0) {
            if (headers[i]?.trim() !== "stock #") {
                errors.push({
                    row_id: 1,
                    column_id: i,
                    column_name: headers[i],
                    error_message: INVALID_HEADER,
                })
            }
        } else if (!STOCK_BULK_UPLOAD_HEADERS.includes(headers[i]?.trim())) {
            errors.push({
                row_id: 1,
                column_id: i,
                column_name: headers[i],
                error_message: INVALID_HEADER,
            })
        }
    }

    if (errors.length > 0) {
        return resUnprocessableEntity({ data: errors });
    }
    return resSuccess();
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

const getStockFromRows = async (headers: string[], rows: any, idAppUser: any) => {
    let currentGroupIndex = -1;
    try {
        let errors: {
            stock_id: string;
            row_id: number;
            error_message: string;
        }[] = [];
        const [
            shapeList,
            colorList,
            clarityList,
            polishList,
            SymmetryList,
            labList,
            fluorescenceList,
            colorIntensityList,
            companyList,
            stockList
        ] = await Promise.all([
            Master.findAll({ where: { master_type: Master_type.Stone_shape, is_deleted: DeleteStatus.No } }),
            Master.findAll({ where: { master_type: Master_type.Diamond_color, is_deleted: DeleteStatus.No } }),
            Master.findAll({ where: { master_type: Master_type.Diamond_clarity, is_deleted: DeleteStatus.No } }),
            Master.findAll({ where: { master_type: Master_type.Polish, is_deleted: DeleteStatus.No } }),
            Master.findAll({ where: { master_type: Master_type.symmetry, is_deleted: DeleteStatus.No } }),
            Master.findAll({ where: { master_type: Master_type.lab, is_deleted: DeleteStatus.No } }),
            Master.findAll({ where: { master_type: Master_type.fluorescence, is_deleted: DeleteStatus.No } }),
            Master.findAll({ where: { master_type: Master_type.colorIntensity, is_deleted: DeleteStatus.No } }),
            Company.findAll({ where: { is_deleted: DeleteStatus.No } }),
            Diamonds.findAll({ where: { is_deleted: DeleteStatus.No } }),
        ]);

        const updateStockList = [];
        const seenStockNumbers: string[] = [];
        const updateStockLogs = [];
        const getNameFromId = (list: any[], id: any) => list.find((item: any) => item.dataValues.id == id)?.dataValues?.name;

        for (const row of rows) {
            currentGroupIndex++;
            if (row["stock #"]) {
                if (seenStockNumbers.includes(row["stock #"])) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 2,
                        error_message: `There is another row with stock # ${row["stock #"]}`,
                    })
                }
                const findStock = await stockList.find(
                    (t: any) => t.dataValues.stock_id == row["stock #"]
                );

                if (!(findStock && findStock.dataValues)) {
                    errors.push({
                        stock_id: row["stock #"],
                        row_id: currentGroupIndex + 2,
                        error_message: prepareMessageFromParams(ERROR_NOT_FOUND,
                            [["field_name", `${row["stock #"]} is`]]),
                    });
                    continue;
                } else {
                    seenStockNumbers.push(findStock?.dataValues.stock_id);
                }

                let shape;
                let quantity;
                let weight;
                let rate;
                let color;
                let color_intensity;
                let colorOverTone;
                let clarity;
                let video;
                let image;
                let certificate;
                let lab;
                let report;
                let polish;
                let symmetry;
                let measurementHeight;
                let measurementWidth;
                let measurementDepth;
                let table;
                let depth;
                let ratio;
                let fluorescence;
                let location;
                let localLocation;
                let userComment;
                let adminComment;
                let looseDiamond;

                const isShapeInclude = headers?.includes("shape");
                const isQuantityInclude = headers?.includes("quantity");
                const isWeightInclude = headers?.includes("weight");
                const isRateInclude = headers?.includes("rate");
                const isColorInclude = headers?.includes("color");
                const isColorIntensityInclude = headers?.includes("color intensity");
                const isColorOverToneInclude = headers?.includes("color over tone");
                const isClarityInclude = headers?.includes("clarity");
                const isVideoInclude = headers?.includes("video");
                const isImageInclude = headers?.includes("image");
                const isCertificateInclude = headers?.includes("certificate");
                const isLabInclude = headers?.includes("lab");
                const isReportInclude = headers?.includes("report");
                const isPolishInclude = headers?.includes("polish");
                const isSymmetryInclude = headers?.includes("symmetry");
                const isMeasurementHeightInclude = headers?.includes("measurement height");
                const isMeasurementWidthInclude = headers?.includes("measurement width");
                const isMeasurementDepthInclude = headers?.includes("measurement depth");
                const isTableInclude = headers?.includes("table %");
                const isDepthInclude = headers?.includes("depth %");
                const isRatioInclude = headers?.includes("ratio");
                const isFluorescenceInclude = headers?.includes("fluorescence");
                const isLocationInclude = headers?.includes("location");
                const isLocalLocationInclude = headers?.includes("local location");
                const isUserCommentInclude = headers?.includes("user comment");
                const isAdminCommentInclude = headers?.includes("admin comment");
                const isLooseDiamondInclude = headers?.includes("loose diamond");

                // shape
                if (isShapeInclude) {
                    if (row.shape == null) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 2,
                            error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [["field_name", "shape"]]),
                        })
                    } else {
                        if (row.shape?.trim().toLocaleLowerCase()?.includes("other")) {
                            shape = getIdFromName("other", shapeList, "name", "shape");
                        } else {
                            shape = getIdFromName(row.shape, shapeList, "name", "shape");
                        }
                        if (shape && shape.error != undefined) {
                            errors.push({
                                stock_id: row["stock #"],
                                row_id: currentGroupIndex + 2,
                                error_message: shape.error,
                            });
                        } else if (shape && shape.data) {
                            shape = shape?.data;
                        } else {
                            shape = null;
                        }
                    }
                }

                // weight
                if (isWeightInclude) {
                    if (row.weight == null) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 2,
                            error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                                ["field_name", "Weight"],
                            ]),
                        });
                    } else {
                        weight = row.weight;
                    }
                }

                // quantity
                if (isQuantityInclude) {
                    quantity = row.quantity ?? 1;
                }

                // rate
                if (isRateInclude) {
                    if (row.rate == null) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 2,
                            error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                                ["field_name", "rate"],
                            ]),
                        });
                    } else {
                        rate = row.rate;
                    }
                }

                // color
                if (isColorInclude) {
                    if (row.color == null) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 2,
                            error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                                ["field_name", "color"],
                            ]),
                        });
                    } else {
                        if (row.color?.trim().toLocaleLowerCase()?.includes("other")) {
                            color = getIdFromName("other", colorList, "name", "color");
                        } else {
                            color = getIdFromName(row.color, colorList, "name", "color");
                        }
                        if (color && color.error != undefined) {
                            errors.push({
                                stock_id: row["stock #"],
                                row_id: currentGroupIndex + 2,
                                error_message: color.error,
                            });
                        } else if (color && color.data) {
                            color = color?.data;
                        } else {
                            color = null;
                        }
                    }
                }

                // color intensity
                if (isColorIntensityInclude) {
                    if (row["color intensity"]) {
                        color_intensity = getIdFromName(row["color intensity"], colorIntensityList, "name", "color intensity");
                        if (color_intensity && color_intensity.error != undefined) {
                            errors.push({
                                stock_id: row["stock #"],
                                row_id: currentGroupIndex + 2,
                                error_message: color_intensity.error,
                            });
                        } else if (color_intensity && color_intensity.data) {
                            color_intensity = color_intensity?.data;
                        } else {
                            color_intensity = null;
                        }
                    }
                }

                // color over tone
                if (isColorOverToneInclude) {
                    colorOverTone = row["color over tone"]
                }

                // clarity
                if (isClarityInclude) {
                    if (row.clarity) {
                        clarity = getIdFromName(row.clarity, clarityList, "name", "clarity");
                        if (clarity && clarity.error != undefined) {
                            errors.push({
                                stock_id: row["stock #"],
                                row_id: currentGroupIndex + 2,
                                error_message: clarity.error,
                            });
                        } else if (clarity && clarity.data) {
                            clarity = clarity?.data;
                        } else {
                            clarity = null;
                        }
                    }
                }

                // video
                if (isVideoInclude) {
                    if (row.video) {
                        video = row.video;
                    }
                }

                // image
                if (isImageInclude) {
                    if (row.image) {
                        image = row.image;
                    }
                }

                // certificate
                if (isCertificateInclude) {
                    if (row.certificate) {
                        certificate = row.certificate;
                    }
                }

                // lab
                if (isLabInclude) {
                    if (row.lab) {
                        lab = getIdFromName(row.lab, labList, "name", "lab");
                        if (lab && lab.error != undefined) {
                            errors.push({
                                stock_id: row["stock #"],
                                row_id: currentGroupIndex + 2,
                                error_message: lab.error,
                            });
                        } else if (lab && lab.data) {
                            lab = lab?.data;
                        } else {
                            lab = null;
                        }
                    }
                }

                // report
                if (isReportInclude) {
                    if (row.report) {
                        report = row.report;
                    }
                }

                // polish
                if (isPolishInclude) {
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
                                row_id: currentGroupIndex + 2,
                                error_message: polish.error,
                            });
                        } else if (polish && polish.data) {
                            polish = polish?.data;
                        } else {
                            polish = null;
                        }
                    }
                }

                // symmetry
                if (isSymmetryInclude) {
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
                                row_id: currentGroupIndex + 2,
                                error_message: symmetry.error,
                            });
                        } else if (symmetry && symmetry.data) {
                            symmetry = symmetry?.data;
                        } else {
                            symmetry = null;
                        }
                    }
                }

                // measurement height
                if (isMeasurementHeightInclude) {
                    if (row["measurement height"]) {
                        measurementHeight = row["measurement height"];
                    }
                }

                // measurement width
                if (isMeasurementWidthInclude) {
                    if (row["measurement width"]) {
                        measurementWidth = row["measurement width"];
                    }
                }

                // measurement depth
                if (isMeasurementDepthInclude) {
                    if (row["measurement depth"]) {
                        measurementDepth = row["measurement depth"];
                    }
                }

                // table %
                if (isTableInclude) {
                    if (row["table %"]) {
                        table = row["table %"];
                    }
                }

                // depth %
                if (isDepthInclude) {
                    if (row["depth %"]) {
                        depth = row["depth %"];
                    }
                }

                // ratio
                if (isRatioInclude) {
                    if (row["ratio"]) {
                        ratio = row["ratio"];
                    }
                }

                // fluorescence
                if (isFluorescenceInclude) {
                    if (row.fluorescence) {
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
                                row_id: currentGroupIndex + 2,
                                error_message: fluorescence.error,
                            });
                        } else if (fluorescence && fluorescence.data) {
                            fluorescence = fluorescence?.data;
                        } else {
                            fluorescence = null;
                        }
                    }
                }

                // location
                if (isLocationInclude) {
                    if (row.location == null) {
                        errors.push({
                            stock_id: row["stock #"],
                            row_id: currentGroupIndex + 2,
                            error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                                ["field_name", "location"],
                            ]),
                        });
                    } else {
                        location = getIdFromName(
                            row.location,
                            companyList,
                            "name",
                            "location"
                        );
                        if (
                            location &&
                            location.error != undefined
                        ) {
                            errors.push({
                                stock_id: row["stock #"],
                                row_id: currentGroupIndex + 2,
                                error_message: location.error,
                            });
                        } else if (location && location.data) {
                            location = location?.data;
                        } else {
                            location = null;
                        }
                    }
                }

                // local location
                if (isLocalLocationInclude) {
                    if (row["local location"]) {
                        localLocation = row["local location"];
                    }
                }

                // user comment
                if (isUserCommentInclude) {
                    if (row["user comment"]) {
                        userComment = row["user comment"];
                    }
                }

                // admin comment
                if (isAdminCommentInclude) {
                    if (row["admin comment"]) {
                        adminComment = row["admin comment"];
                    }
                }

                // loose diamond
                if (isLooseDiamondInclude) {
                    if (row["loose diamond"] == null) {
                        looseDiamond = Is_loose_diamond.No;
                    } else {
                        looseDiamond = row["loose diamond"].charAt(0).toUpperCase() + row["loose diamond"].slice(1).toLowerCase();
                        if (!(Object.values(Is_loose_diamond).includes(looseDiamond))) {
                            errors.push({
                                stock_id: row["stock #"],
                                row_id: currentGroupIndex + 2,
                                error_message: `Loose Diamond value ${looseDiamond} is not valid. Valid values are ${Object.values(Is_loose_diamond).join("and ")}.`,
                            });
                        }
                    }
                }

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
                    shape: isShapeInclude ? row.shape : oldValues.shape,
                    quantity: quantity ? quantity !=
                        oldValues.remain_quantity
                        ? Number(findStock.dataValues.quantity) +
                        Number(quantity) -
                        Number(findStock.dataValues.remain_quantity)
                        : oldValues.quantity : oldValues.quantity,
                    remain_quantity: quantity ?? oldValues.quantity,
                    weight: isWeightInclude ? weight : oldValues.weight,
                    rate: isRateInclude ? rate : oldValues.rate,
                    color: isColorInclude ? row.color : oldValues.color,
                    color_intensity: isColorIntensityInclude ? row["color intensity"] : oldValues.color_intensity,
                    color_over_tone: isColorOverToneInclude ? row["color over tone"] : oldValues.color_over_tone,
                    clarity: isClarityInclude ? row.clarity : oldValues.clarity,
                    video: isVideoInclude ? video : oldValues.video,
                    image: isImageInclude ? image : oldValues.image,
                    certificate: isCertificateInclude ? certificate : oldValues.certificate,
                    lab: isLabInclude ? row.lab : oldValues.lab,
                    report: isReportInclude ? report : oldValues.report,
                    polish: isPolishInclude ? row.polish : oldValues.polish,
                    symmetry: isSymmetryInclude ? row.symmetry : oldValues.symmetry,
                    measurement_height: isMeasurementHeightInclude ? measurementHeight : oldValues.measurement_height,
                    measurement_width: isMeasurementWidthInclude ? measurementWidth : oldValues.measurement_width,
                    measurement_depth: isMeasurementDepthInclude ? measurementDepth : oldValues.measurement_depth,
                    table_value: isTableInclude ? table : oldValues.table_value,
                    depth_value: isDepthInclude ? depth : oldValues.depth_value,
                    ratio: isRatioInclude ? ratio : oldValues.ratio,
                    fluorescence: isFluorescenceInclude ? row.fluorescence : oldValues.fluorescence,
                    company_id: isLocationInclude ? location : oldValues.company_id,
                    local_location: isLocalLocationInclude ? localLocation : oldValues.local_location,
                    user_comments: isUserCommentInclude ? userComment : oldValues.user_comments,
                    admin_comments: isAdminCommentInclude ? adminComment : oldValues.admin_comments,
                    loose_diamond: isLooseDiamondInclude ? looseDiamond : oldValues.loose_diamond,
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


                updateStockList.push({
                    ...findStock.dataValues,
                    id: findStock.dataValues.id,
                    stock_id: row["stock #"],
                    shape: isShapeInclude ? shape : findStock.dataValues.shape,
                    quantity: quantity ? quantity !=
                        findStock.dataValues.remain_quantity
                        ? Number(findStock.dataValues.quantity) +
                        Number(quantity) -
                        Number(findStock.dataValues.remain_quantity)
                        : findStock.dataValues.quantity : findStock.dataValues.quantity,
                    remain_quantity: quantity ?? findStock.dataValues.quantity,
                    weight: isWeightInclude ? weight : findStock.dataValues.weight,
                    rate: isRateInclude ? rate : findStock.dataValues.rate,
                    color: isColorInclude ? color : findStock.dataValues.color,
                    color_intensity: isColorIntensityInclude ? color_intensity : findStock.dataValues.color_intensity,
                    color_over_tone: isColorOverToneInclude ? colorOverTone : findStock.dataValues.color_over_tone,
                    clarity: isClarityInclude ? clarity : findStock.dataValues.clarity,
                    video: isVideoInclude ? video : findStock.dataValues.video,
                    image: isImageInclude ? image : findStock.dataValues.image,
                    certificate: isCertificateInclude ? certificate : findStock.dataValues.certificate,
                    lab: isLabInclude ? lab : findStock.dataValues.lab,
                    report: isReportInclude ? report : findStock.dataValues.report,
                    polish: isPolishInclude ? polish : findStock.dataValues.polish,
                    symmetry: isSymmetryInclude ? symmetry : findStock.dataValues.symmetry,
                    measurement_height: isMeasurementHeightInclude ? measurementHeight : findStock.dataValues.measurement_height,
                    measurement_width: isMeasurementWidthInclude ? measurementWidth : findStock.dataValues.measurement_width,
                    measurement_depth: isMeasurementDepthInclude ? measurementDepth : findStock.dataValues.measurement_depth,
                    table_value: isTableInclude ? table : findStock.dataValues.table_value,
                    depth_value: isDepthInclude ? depth : findStock.dataValues.depth_value,
                    ratio: isRatioInclude ? ratio : findStock.dataValues.ratio,
                    fluorescence: isFluorescenceInclude ? fluorescence : findStock.dataValues.fluorescence,
                    company_id: isLocationInclude ? location : findStock.dataValues.company_id,
                    local_location: isLocalLocationInclude ? localLocation : findStock.dataValues.local_location,
                    user_comments: isUserCommentInclude ? userComment : findStock.dataValues.user_comments,
                    admin_comments: isAdminCommentInclude ? adminComment : findStock.dataValues.admin_comments,
                    loose_diamond: isLooseDiamondInclude ? looseDiamond : findStock.dataValues.loose_diamond,
                    status: findStock.dataValues.status,
                    modified_by: idAppUser,
                    modified_at: getLocalDate(),
                });
            }
        }

        if (errors.length > 0) {
            return resUnprocessableEntity({ data: errors });
        }

        return resSuccess({
            data: { updateStockList, updateStockLogs }
        });

    } catch (error) {
        return resUnknownError({ data: error })
    }
}

const updateToDb = async (list: any, headers: string[], idAppUser: number) => {
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

        const attributes = [
            "shape", "quantity", "remain_quantity", "weight", "rate", "color", "color_intensity", "color_over_tone", "clarity",
            "video", "image", "certificate", "lab", "report", "polish", "symmetry", "measurement_height", "measurement_width",
            "measurement_depth", "table_value", "depth_value", "ratio", "fluorescence", "company_id", "local_location",
            "user_comments", "admin_comments", "loose_diamond"
        ];

        const headerToAttributeMap = {
            "shape": "shape",
            "quantity": "quantity",
            "weight": "weight",
            "rate": "rate",
            "color": "color",
            "color intensity": "color_intensity",
            "color over tone": "color_over_tone",
            "clarity": "clarity",
            "video": "video",
            "image": "image",
            "certificate": "certificate",
            "lab": "lab",
            "report": "report",
            "polish": "polish",
            "symmetry": "symmetry",
            "measurement height": "measurement_height",
            "measurement width": "measurement_width",
            "measurement depth": "measurement_depth",
            "table %": "table_value",
            "depth %": "depth_value",
            "ratio": "ratio",
            "fluorescence": "fluorescence",
            "location": "company_id",
            "local location": "local_location",
            "user comment": "user_comments",
            "admin comment": "admin_comments",
            "loose diamond": "loose_diamond"
        };

        const updateAttribute = [];

        for (const header of headers) {
            const attribute = headerToAttributeMap[header as keyof typeof headerToAttributeMap];
            if (attribute && attributes.includes(attribute)) {
                updateAttribute.push(attribute);
            }
        }

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

        trn = await dbContext.transaction();

        const update = await Diamonds.bulkCreate(list?.updateStockList, {
            updateOnDuplicate: [
                ...updateAttribute,
                "modified_by",
                "modified_at",
            ],
            transaction: trn
        });

        for (let i = 0; i < list?.updateStockList?.length; i++) {
            const stock = list?.updateStockList[i];
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

        if (apiDetail?.length > 0) {
            await ApiStockDetails.bulkCreate(apiDetail, {
                transaction: trn,
            });
        }

        await trn.commit();
        await refreshMaterializedViews()

        return resSuccess({ data: list?.updateStockList });
    } catch (error) {
        if (trn) {
            await trn.rollback();
        }
        return resUnknownError({ data: error })
    }
}