import { Request } from "express";
import {
    getLocalDate,
    prepareMessageFromParams,
    refreshMaterializedDiamondListView,
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
import Master from "../../model/masters.model";
import dbContext from "../../config/dbContext";
import PacketDiamonds from "../../model/packet-diamond.model";
import Company from "../../model/companys.model";
import { Op } from "sequelize";
const readXlsxFile = require("read-excel-file/node");

const validateFile = (file: Express.Multer.File) => {
    if (!file) {
        return resUnprocessableEntity({ message: FILE_NOT_FOUND });
    }
    if (file.mimetype !== PRODUCT_BULK_UPLOAD_FILE_MIMETYPE) {
        return resUnprocessableEntity({ message: PRODUCT_BULK_UPLOAD_FILE_MIMETYPE_ERROR_MESSAGE });
    }
    if (file.size > PRODUCT_BULK_UPLOAD_FILE_SIZE * 1024 * 1024) {
        return resUnprocessableEntity({ message: PRODUCT_BULK_UPLOAD_FILE_SIZE_ERROR_MESSAGE });
    }
    return null;
};

export const addPacketCSVFile = async (req: Request) => {
    try {
        const file = req?.file as Express.Multer.File;

        const fileValidationError = validateFile(file);
        if (fileValidationError) return fileValidationError;

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
            created_by: req.body.session_res.id,
            created_date: getLocalDate(),
        });

        const resPDBUF = await processPacketBulkUploadFile(
            resPBUF.dataValues.id,
            resMFTL.data,
            req.body.session_res.id
        );

        return resPDBUF;
    } catch (e) {
        return resUnknownError({ data: e });
    }
};

const processPacketBulkUploadFile = async (
    id: number,
    path: string,
    idAppUser: number
) => {
    try {
        const data = await processCSVFile(path, idAppUser);

        const status = data.code === DEFAULT_STATUS_CODE_SUCCESS
            ? FILE_STATUS.ProcessedSuccess
            : FILE_STATUS.ProcessedError;

        await ProductBulkUploadFile.update(
            {
                status,
                error: status === FILE_STATUS.ProcessedError ? JSON.stringify(data.data) : null,
                modified_date: getLocalDate(),
            },
            { where: { id } }
        );

        return data;
    } catch (e) {
        await ProductBulkUploadFile.update(
            {
                status: FILE_STATUS.ProcessedError,
                error: JSON.stringify(e),
                modified_date: getLocalDate(),
            },
            { where: { id } }
        );
        throw e;
    }
};

const processCSVFile = async (path: string, idAppUser: number) => {
    try {
        const resRows = await getArrayOfRowsFromCSVFile(path);
        if (resRows.code !== DEFAULT_STATUS_CODE_SUCCESS) return resRows;

        const { headers, results } = resRows.data;

        const resVH = await validateHeaders(headers);
        if (resVH.code !== DEFAULT_STATUS_CODE_SUCCESS) return resVH;

        const resProducts = await getPacketFromRows(results, idAppUser);
        if (resProducts.code !== DEFAULT_STATUS_CODE_SUCCESS) return resProducts;

        const resAPTD = await addGroupToDB(resProducts.data);
        if (resAPTD.code !== DEFAULT_STATUS_CODE_SUCCESS) return resAPTD;

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
    const PACKET_BULK_UPLOAD_HEADERS = [
        "packet #",
        "shape",
        "quantity",
        "weight",
        "price per carat",
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
        "admin comment"
    ];

    const errors = headers.map((header, index) => {
        if (header.trim() !== PACKET_BULK_UPLOAD_HEADERS[index]) {
            return {
                row_id: 1,
                column_id: index,
                column_name: header,
                error_message: INVALID_HEADER,
            };
        }
    }).filter(Boolean);

    if (errors.length > 0) {
        return resUnprocessableEntity({ data: errors });
    }
    return resSuccess();
};

const getPacketFromRows = async (rows: any, idAppUser: any) => {
    let currentGroupIndex = -1;
    try {
        let errors: {
            packet_id: string;
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
        const packetList = await PacketDiamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
            },
        });

        let updatedPacketList = [];
        let createdPacketList = [];
        const seenPacketNumbers = new Set<string>();
        for (const row of rows) {
            currentGroupIndex++;
            const packetNumber = row["packet #"];
            if (packetNumber) {
                if (seenPacketNumbers.has(packetNumber)) {
                    errors.push({
                        packet_id: row["packet #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: "Duplicate packet number",
                    });
                }
                seenPacketNumbers.add(packetNumber);
                if (row.shape == null) {
                    errors.push({
                        packet_id: row["packet #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "shape"],
                        ]),
                    });
                }
                if (row.weight == null) {
                    errors.push({
                        packet_id: row["packet #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "Weight"],
                        ]),
                    });
                }
                if (row["price per carat"] == null) {
                    errors.push({
                        packet_id: row["packet #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "Price per carat"],
                        ]),
                    });
                }
                if (row.color == null) {
                    errors.push({
                        packet_id: row["packet #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "color"],
                        ]),
                    });
                }
                if (row.location == null) {
                    errors.push({
                        packet_id: row["packet #"],
                        row_id: currentGroupIndex + 1 + 1,
                        error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                            ["field_name", "location"],
                        ]),
                    });
                }
                if (row.rate == null) {
                    if (!(row["price per carat"] == null || row.weight == null)) {
                        row.rate = row["price per carat"] * row.weight;
                    }
                }

                let shape: any;

                if (row.shape?.trim().toLocaleLowerCase()?.includes("other")) {
                    shape = getIdFromName("other", shapeList, "name", "shape");
                } else {
                    shape = getIdFromName(row.shape, shapeList, "name", "shape");
                }

                if (shape && shape.error != undefined) {
                    errors.push({
                        packet_id: row["packet #"],
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

                let carat_rate: any = row["price per carat"];

                let rate: any = row.rate;


                let color: any;

                if (row.color?.trim().toLocaleLowerCase()?.includes("other")) {
                    color = getIdFromName("other", colorList, "name", "color");
                } else {
                    color = getIdFromName(row.color, colorList, "name", "color");
                }

                if (color && color.error != undefined) {
                    errors.push({
                        packet_id: row["packet #"],
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
                            packet_id: row["packet #"],
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
                            packet_id: row["packet #"],
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
                            packet_id: row["packet #"],
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
                            packet_id: row["packet #"],
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
                            packet_id: row["packet #"],
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
                            packet_id: row["packet #"],
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
                        packet_id: row["packet #"],
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

                const findPacket = await packetList.find(
                    (t: any) => t.dataValues.packet_id == row["packet #"]
                );


                if (findPacket && findPacket !== undefined && findPacket != null) {
                    updatedPacketList.push({
                        id: findPacket.dataValues.id,
                        packet_id: row["packet #"],
                        shape,
                        quantity: quantity !=
                        findPacket.dataValues.remain_quantity
                        ? Number(findPacket.dataValues.quantity) +
                        Number(quantity) -
                        Number(findPacket.dataValues.remain_quantity)
                            : findPacket.dataValues.quantity,
                        remain_quantity: quantity,
                        weight: weight !=
                        findPacket.dataValues.remain_weight
                        ? Number(findPacket.dataValues.weight) +
                        Number(weight) -
                        Number(findPacket.dataValues.remain_weight)
                            : findPacket.dataValues.weight,
                        remain_weight: weight,
                        carat_rate,
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
                        status: findPacket.dataValues.status,
                        modified_by: idAppUser,
                        modified_at: getLocalDate(),
                        created_at: getLocalDate(),
                        created_by: idAppUser,
                    });
                } else {
                    createdPacketList.push({
                        packet_id: row["packet #"],
                        shape,
                        quantity,
                        remain_quantity: quantity,
                        weight,
                        remain_weight: weight,
                        carat_rate,
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
                        status: StockStatus.AVAILABLE,
                        is_active: ActiveStatus.Active,
                        is_deleted: DeleteStatus.No,
                        created_by: idAppUser,
                        created_at: getLocalDate(),
                    });
                }
            } else {
                errors.push({
                    packet_id: "",
                    row_id: currentGroupIndex + 1 + 1,
                    error_message: prepareMessageFromParams(REQUIRED_ERROR_MESSAGE, [
                        ["field_name", "packet #"],
                    ]),
                });
            }
        }

        if (errors.length > 0) {
            return resUnprocessableEntity({ data: errors });
        }

        return resSuccess({
            data: { create: createdPacketList, update: updatedPacketList },
        });
    } catch (e) {
        throw e;
    }
};

const addGroupToDB = async (list: any) => {
    const trn = await dbContext.transaction();
    try {
        if (list.create.length > 0) {
            await PacketDiamonds.bulkCreate(list.create, {
                transaction: trn,
            });
        }

        if (list.update.length > 0) {
            await PacketDiamonds.bulkCreate(list.update, {
                transaction: trn,
                updateOnDuplicate: [
                    "packet_id",
                    "shape",
                    "quantity",
                    "remain_quantity",
                    "weight",
                    "remain_weight",
                    "carat_rate",
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
                    "modified_by",
                    "modified_at",
                ],
            });
        }
        await trn.commit();
        await refreshMaterializedDiamondListView()

        return resSuccess({ data: list });
    } catch (e) {
        console.log(e)
        await trn.rollback();
        throw e;
    }
};

export const updateBulkPacketStatus = async (req: Request) => {
    const { packet_id, status } = req.body
    try {
        const error = [];

        const packets = await PacketDiamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No
            }
        });

        if (packet_id.length > 0) {
            for (let index = 0; index < packet_id.length; index++) {
                const number = packet_id[index];
                const findPacket = packets.find((data) => {
                    return data.dataValues.packet_id === number
                })

                if (!(findPacket && findPacket.dataValues)) {
                    error.push(`${number} Packet not found`)
                }
            }
        }

        if (error.length > 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Packet"]]),
                data: error.map(err => err)
            })
        }

        const updatedPacketList = [];
        for (let index = 0; index < packet_id.length; index++) {
            const number = packet_id[index];
            const findPacket = packets.find((packet) => packet.dataValues.packet_id == number);
            if (findPacket && findPacket.dataValues) {
                updatedPacketList.push({
                    ...findPacket.dataValues,
                    is_active: status,
                    modified_at: getLocalDate(),
                    modified_by: req.body.session_res.id,
                });
            }
        }

        if (updatedPacketList.length > 0) {
            await PacketDiamonds.bulkCreate(updatedPacketList, {
                updateOnDuplicate: ["is_active", "modified_by", "modified_at"],
            })
        }
        await refreshMaterializedDiamondListView()

        return resSuccess({ message: RECORD_UPDATE })


    } catch (error) {
        throw error;
    }

}

export const deleteBulkPacket = async (req: Request) => {
    const { packet_id } = req.params
    try {
        const packetList = packet_id.split(",");

        const error = [];

        const packets = await PacketDiamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
                status: {
                    [Op.ne]: StockStatus.MEMO
                }
            }
        });

        if (packetList.length > 0) {
            for (let index = 0; index < packetList.length; index++) {
                const number = packetList[index];
                const findPacket = packets.find((data) => {
                    return data.dataValues.packet_id === number
                })

                if (!(findPacket && findPacket.dataValues)) {
                    error.push(`${number} Packet not found`)
                }
            }
        }

        if (error.length > 0) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Packet"]]),
                data: error.map(err => err)
            })
        }

        const updatedPacketList = [];
        for (let index = 0; index < packetList.length; index++) {
            const number = packetList[index];
            const findPacket = packets.find((packet) => packet.dataValues.packet_id == number);
            if (findPacket && findPacket.dataValues) {
                updatedPacketList.push({
                    ...findPacket.dataValues,
                    is_deleted: DeleteStatus.Yes,
                    deleted_at: getLocalDate(),
                    deleted_by: req.body.session_res.id,
                });
            }
        }

        if (updatedPacketList.length > 0) {
            await PacketDiamonds.bulkCreate(updatedPacketList, {
                updateOnDuplicate: ["is_deleted", "deleted_by", "deleted_at"],
            })
        }
        await refreshMaterializedDiamondListView()

        return resSuccess({ message: RECORD_DELETED })


    } catch (error) {
        throw error;
    }

}