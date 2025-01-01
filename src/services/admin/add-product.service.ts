import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, resNotFound, resSuccess } from "../../utils/shared-functions";
import { DATA_ALREADY_EXITS, ERROR_NOT_FOUND } from "../../utils/app-messages";
import Master from "../../model/masters.model";
import { ActiveStatus, DeleteStatus, Master_type } from "../../utils/app-enumeration";
import Location from "../../model/companys.model";
import { Op, Sequelize } from "sequelize";

export const addStock = async (req: Request) => {
    try {
        const {
            stock_id,
            status,
            shape,
            quantity,
            weight,
            rate,
            color,
            color_intensity,
            clarity,
            lab,
            report,
            polish,
            symmetry,
            video,
            image,
            certificate,
            measurement,
            table_value,
            depth_value,
            ratio,
            fluorescence,
            location_id,
            userComments,
            adminComments,
            session_res
        } = req.body

        const findDiamond = await Diamonds.findOne({
            where: {
                stock_id: stock_id
            }
        })

        const MastersData = await Master.findAll({
            where: {
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })

        const shapeData = MastersData.filter(item => item.dataValues.master_type === Master_type.Stone_shape && item.dataValues.id === shape)
        const colorData = MastersData.filter(item => item.dataValues.master_type === Master_type.Diamond_color && item.dataValues.id === color)
        const clarityData = MastersData.filter(item => item.dataValues.master_type === Master_type.Diamond_clarity && item.dataValues.id === clarity)
        const labData = MastersData.filter(item => item.dataValues.master_type === Master_type.lab && item.dataValues.id === lab)
        const polishData = MastersData.filter(item => item.dataValues.master_type === Master_type.Polish && item.dataValues.id === polish)
        const symmetryData = MastersData.filter(item => item.dataValues.master_type === Master_type.symmetry && item.dataValues.id === symmetry)
        const colorIntensityData = MastersData.filter(item => item.dataValues.master_type === Master_type.fancyColorIntensity && item.dataValues.id === color_intensity)
        const fluorescenceData = MastersData.filter(item => item.dataValues.master_type === Master_type.fluorescence && item.dataValues.id === fluorescence)
        const locationData = await Location.findOne({
            where: {
                id: location_id
            }
        })

        function generateMissingFieldsMessage(missingFields: string[]) {
            const fieldsList = missingFields.join(", ");
            return prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", fieldsList]]);
        }

        // Check for missing fields
        const missingFields = [];
        if (!shapeData) missingFields.push("Shape Data");
        if (!colorData) missingFields.push("Color Data");
        if (!clarityData) missingFields.push("Clarity Data");
        if (!labData) missingFields.push("Lab Data");
        if (!polishData) missingFields.push("Polish Data");
        if (!symmetryData) missingFields.push("Symmetry Data");
        if (!colorIntensityData) missingFields.push("Color Intensity Data");
        if (!locationData) missingFields.push("Location Data");
        if (!fluorescenceData) missingFields.push("fluorescenceData Data");

        // If there are missing fields, return an appropriate response
        if (missingFields.length > 0) {
            return resNotFound({
                message: generateMissingFieldsMessage(missingFields),
            });
        }

        if (findDiamond && findDiamond.dataValues) {
            return resNotFound({
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [["field_name", "Diamond"]]),
            })
        }

        await Diamonds.create({
            stock_id: stock_id,
            status: status,
            is_active: ActiveStatus.Active,
            is_deleted: DeleteStatus.No,
            shape: shape,
            quantity: quantity,
            weight: weight,
            rate: rate,
            color: color,
            color_intensity: color_intensity,
            clarity: clarity,
            lab: lab,
            report: report,
            polish: polish,
            symmetry: symmetry,
            video: video,
            image: image,
            certificate: certificate,
            measurement: measurement,
            table_value: table_value,
            depth_value: depth_value,
            ratio: ratio,
            fluorescenceData: fluorescenceData,
            location_id: location_id,
            user_comments: userComments,
            admin_comments: adminComments,
            created_by: session_res.user_id,
            created_at: getLocalDate(),
        })

        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const updateProduct = async (req: Request) => {
    try {
        const {
            stock_id,
            available,
            is_active,
            is_deleted,
            shape,
            quantity,
            weight,
            rate,
            color,
            color_intensity,
            clarity,
            lab,
            report,
            polish,
            symmetry,
            video,
            image,
            certificate,
            measurement,
            table_value,
            depth_value,
            ratio,
            flo,
            location_id,
            comments,
            session_res
        } = req.body
        const { diamond_id } = req.params

        const findDiamond = await Diamonds.findOne({
            where: {
                stock_id: stock_id
            }
        })

        const MastersData = await Master.findAll({
            where: {
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })

        const shapeData = MastersData.filter(item => item.dataValues.master_type === Master_type.Stone_shape && item.dataValues.id === shape)
        const colorData = MastersData.filter(item => item.dataValues.master_type === Master_type.Diamond_color && item.dataValues.id === color)
        const clarityData = MastersData.filter(item => item.dataValues.master_type === Master_type.Diamond_clarity && item.dataValues.id === clarity)
        const labData = MastersData.filter(item => item.dataValues.master_type === Master_type.lab && item.dataValues.id === lab)
        const polishData = MastersData.filter(item => item.dataValues.master_type === Master_type.Polish && item.dataValues.id === polish)
        const symmetryData = MastersData.filter(item => item.dataValues.master_type === Master_type.symmetry && item.dataValues.id === symmetry)
        const colorIntensityData = MastersData.filter(item => item.dataValues.master_type === Master_type.colorIntensity && item.dataValues.id === color_intensity)
        const locationData = await Location.findOne({
            where: {
                id: location_id
            }
        })

        function generateMissingFieldsMessage(missingFields: string[]) {
            const fieldsList = missingFields.join(", ");
            return prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", fieldsList]]);
        }

        // Check for missing fields
        const missingFields = [];
        if (!shapeData) missingFields.push("Shape Data");
        if (!colorData) missingFields.push("Color Data");
        if (!clarityData) missingFields.push("Clarity Data");
        if (!labData) missingFields.push("Lab Data");
        if (!polishData) missingFields.push("Polish Data");
        if (!symmetryData) missingFields.push("Symmetry Data");
        if (!colorIntensityData) missingFields.push("Color Intensity Data");
        if (!locationData) missingFields.push("Location Data");

        // If there are missing fields, return an appropriate response
        if (missingFields.length > 0) {
            return resNotFound({
                message: generateMissingFieldsMessage(missingFields),
            });
        }

        if (findDiamond && findDiamond.dataValues) {
            return resNotFound({
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [["field_name", "Diamond"]]),
            })
        }

        await Diamonds.update({
            stock_id: stock_id,
            available: available,
            is_active: is_active,
            is_deleted: is_deleted,
            shape: shape,
            quantity: quantity,
            weight: weight,
            rate: rate,
            color: color,
            color_intensity: color_intensity,
            clarity: clarity,
            lab: lab,
            report: report,
            polish: polish,
            symmetry: symmetry,
            video: video,
            image: image,
            certificate: certificate,
            measurement: measurement,
            table_value: table_value,
            depth_value: depth_value,
            ratio: ratio,
            flo: flo,
            location_id: location_id,
            comments: comments,
            modified_by: session_res.user_id,
            modified_at: getLocalDate(),
        }, {
            where: {
                id: diamond_id
            }
        })

        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const deleteProduct = async (req: Request) => {
    try {
        const { diamond_id } = req.params

        const findDiamond = await Diamonds.findOne({
            where: {
                id: diamond_id
            }
        })
        if (!(findDiamond && findDiamond.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond"]]),
            })
        }

        await Diamonds.update({
            is_deleted: DeleteStatus.Yes,
            deleted_at: getLocalDate(),
            deleted_by: req.body.session_res.user_id,
        }, {
            where: {
                id: diamond_id
            }
        })
        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const getProduct = async (req: Request) => {
    try {
        const { diamond_id } = req.params

        const findDiamond = await Diamonds.findOne({
            where: {
                id: diamond_id,
                is_deleted: DeleteStatus.No,
            },
            attributes: [
                "id",
                "stock_id",
                "available",
                "is_active",
                "is_deleted",
                [Sequelize.literal(`"shape"."name"`), "shape"],
                [Sequelize.literal(`"clarity"."name"`), "clarity"],
                [Sequelize.literal(`"color"."name"`), "color"],
                [Sequelize.literal(`"color_intensity"."name"`), "color_intensity"],
                [Sequelize.literal(`"lab"."name"`), "lab"],
                [Sequelize.literal(`"polish"."name"`), "polish"],
                [Sequelize.literal(`"symmetry"."name"`), "symmetry"],
                [Sequelize.literal(`"location"."name"`), "location"],
                "quantity",
                "weight",
                "rate",
                "report",
                "video",
                "image",
                "certificate",
                "measurement",
                "table_value",
                "depth_value",
                "ratio",
                "flo",
                "comments",
                "is_active"
            ],
            include: [
                {
                    model: Master,
                    as: "shape",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "color",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "color_intensity",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "clarity",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "lab",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "polish",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "symmetry",
                    attributes: [],
                },
                {
                    model: Location,
                    as: "location",
                    attributes: [],
                },
            ]
        })
        if (!(findDiamond && findDiamond.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond"]]),
            })
        }

        return resSuccess({
            data: findDiamond.dataValues
        })
    } catch (error) {
        throw error;
    }
}

export const getAllProducts = async (req: Request) => {
    try {
        const { query } = req;
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text,
        };

        const totalItems = await Master.count({
            where: {
                is_deleted: DeleteStatus.No,
            },
        });

        if (totalItems === 0) {
            return resSuccess({ data: { pagination, result: [] } });
        }

        pagination.total_items = totalItems;
        pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

        const DiamondsData = await Diamonds.findAll({
            where: {
                is_deleted: DeleteStatus.No,
            },
            limit: pagination.per_page_rows,
            offset: (pagination.current_page - 1) * pagination.per_page_rows,
            order: [[pagination.sort_by, pagination.order_by]],
            attributes: [
                "id",
                "stock_id",
                "available",
                "is_active",
                "is_deleted",
                [Sequelize.literal(`"shape"."name"`), "shape"],
                [Sequelize.literal(`"clarity"."name"`), "clarity"],
                [Sequelize.literal(`"color"."name"`), "color"],
                [Sequelize.literal(`"color_intensity"."name"`), "color_intensity"],
                [Sequelize.literal(`"lab"."name"`), "lab"],
                [Sequelize.literal(`"polish"."name"`), "polish"],
                [Sequelize.literal(`"symmetry"."name"`), "symmetry"],
                [Sequelize.literal(`"location"."name"`), "location"],
                "quantity",
                "weight",
                "rate",
                "report",
                "video",
                "image",
                "certificate",
                "measurement",
                "table_value",
                "depth_value",
                "ratio",
                "flo",
                "comments",
                "is_active"
            ],
            include: [
                {
                    model: Master,
                    as: "shape",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "color",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "color_intensity",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "clarity",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "lab",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "polish",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "symmetry",
                    attributes: [],
                },
                {
                    model: Location,
                    as: "location",
                    attributes: [],
                },
            ]
        });
        return resSuccess({
            data: { pagination, result: DiamondsData }
        })
    } catch (error) {
        throw error;
    }
}