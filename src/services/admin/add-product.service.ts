import { Request } from "express";
import Diamonds from "../../model/diamond.model";
import { getInitialPaginationFromQuery, getLocalDate, prepareMessageFromParams, resBadRequest, resNotFound, resSuccess } from "../../utils/shared-functions";
import { DATA_ALREADY_EXITS, DUPLICATE_ERROR_CODE, DUPLICATE_VALUE_ERROR_MESSAGE, ERROR_NOT_FOUND, RECORD_UPDATE } from "../../utils/app-messages";
import Master from "../../model/masters.model";
import { ActiveStatus, DeleteStatus, Master_type } from "../../utils/app-enumeration";
import Company from "../../model/companys.model";
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
            measurement_height,
            measurement_depth,
            measurement_width,
            table_value,
            depth_value,
            ratio,
            fluorescence,
            company_id,
            userComments,
            adminComments,
            local_location,
            session_res
        } = req.body

        const findDiamond = await Diamonds.findOne({
            where: {
                stock_id: stock_id,
                is_deleted: DeleteStatus.No
            }
        })

        const MastersData = await Master.findAll({
            where: {
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })

        const shapeData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Stone_shape && item.dataValues.id === shape)
        const colorData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Diamond_color && item.dataValues.id === color)
        const clarityData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Diamond_clarity && item.dataValues.id === clarity)
        const labData: any = MastersData.find(item => item.dataValues.master_type === Master_type.lab && item.dataValues.id === lab)
        const polishData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Polish && item.dataValues.id === polish)
        const symmetryData: any = MastersData.find(item => item.dataValues.master_type === Master_type.symmetry && item.dataValues.id === symmetry)
        const colorIntensityData: any = MastersData.find(item => item.dataValues.master_type === Master_type.colorIntensity && item.dataValues.id === color_intensity)
        const fluorescenceData: any = MastersData.find(item => item.dataValues.master_type === Master_type.fluorescence && item.dataValues.id === fluorescence)
        const companyData: any = await Company.findOne({
            where: {
                id: company_id,
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })
        
        // Check for missing fields
        const missingFields = [];
        if (!(shapeData && shapeData.dataValues)) missingFields.push("Shape Data");
        if (!(colorData && colorData.dataValues)) missingFields.push("Color Data");
        if (!(clarityData && clarityData.dataValues)) missingFields.push("Clarity Data");
        if (!(labData && labData.dataValues)) missingFields.push("Lab Data");
        if (!(polishData && polishData.dataValues)) missingFields.push("Polish Data");
        if (!(symmetryData && symmetryData.dataValues)) missingFields.push("Symmetry Data");
        if (!(colorIntensityData && colorIntensityData.dataValues)) missingFields.push("Color Intensity Data");
        if (!(companyData && companyData.dataValues)) missingFields.push("Location Data");
        if (fluorescence) if (!(fluorescenceData && fluorescenceData.dataValues)) missingFields.push("fluorescence Data");

        // If there are missing fields, return an appropriate response
        if (missingFields.length > 0) {
            return resNotFound({
                data: missingFields.map((field) => prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", field]]))
            });
        }

        if (findDiamond && findDiamond.dataValues) {
            return resNotFound({
                message: prepareMessageFromParams(DATA_ALREADY_EXITS, [["field_name", "Diamond"]]),
            })
        }

        // await Diamonds.create({
        //     stock_id: stock_id,
        //     status: status,
        //     is_active: ActiveStatus.Active,
        //     is_deleted: DeleteStatus.No,
        //     shape: shape,
        //     quantity: quantity,
        //     weight: weight,
        //     rate: rate,
        //     color: color,
        //     color_intensity: color_intensity,
        //     clarity: clarity,
        //     lab: lab,
        //     report: report,
        //     polish: polish,
        //     symmetry: symmetry,
        //     video: video,
        //     image: image,
        //     certificate: certificate,
        //     measurement_height,
        //     measurement_width,
        //     measurement_depth,
        //     local_location,
        //     table_value: table_value,
        //     depth_value: depth_value,
        //     ratio: ratio,
        //     fluorescence: fluorescence,
        //     company_id: company_id,
        //     user_comments: userComments,
        //     admin_comments: adminComments,
        //     created_by: session_res.id,
        //     created_at: getLocalDate(),
        // })

        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const updateStock = async (req: Request) => {
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
            measurement_height,
            measurement_width,
            measurement_depth,
            table_value,
            depth_value,
            ratio,
            fluorescence,
            company_id,
            comments,
            local_location,
            session_res
        } = req.body
        const { diamond_id } = req.params

        const diamond = await Diamonds.findOne({
            where: {
                is_deleted: DeleteStatus.No,
                id: diamond_id
            }
        })

        if (!(diamond && diamond.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond"]]),
            })
        }

        const duplicateDiamond = await Diamonds.findOne({
            where: {
                is_deleted: DeleteStatus.No,
                id: { [Op.ne]: diamond.dataValues.id },
                stock_id: stock_id
            }
        })

        if (duplicateDiamond && duplicateDiamond.dataValues) {
            return resBadRequest({
                code: DUPLICATE_ERROR_CODE,
                message: prepareMessageFromParams(DUPLICATE_VALUE_ERROR_MESSAGE, [
                    ["field_name", "Diamond"],
                ]),
            });
        }

        const MastersData = await Master.findAll({
            where: {
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })

        const shapeData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Stone_shape && item.dataValues.id === shape)
        const colorData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Diamond_color && item.dataValues.id === color)
        const clarityData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Diamond_clarity && item.dataValues.id === clarity)
        const labData: any = MastersData.find(item => item.dataValues.master_type === Master_type.lab && item.dataValues.id === lab)
        const polishData: any = MastersData.find(item => item.dataValues.master_type === Master_type.Polish && item.dataValues.id === polish)
        const symmetryData: any = MastersData.find(item => item.dataValues.master_type === Master_type.symmetry && item.dataValues.id === symmetry)
        const colorIntensityData: any = MastersData.find(item => item.dataValues.master_type === Master_type.colorIntensity && item.dataValues.id === color_intensity)
        const fluorescenceData: any = MastersData.find(item => item.dataValues.master_type === Master_type.fluorescence && item.dataValues.id === fluorescence)
        const companyData: any = await Company.findOne({
            where: {
                id: company_id,
                is_active: ActiveStatus.Active,
                is_deleted: DeleteStatus.No
            }
        })
        
        // Check for missing fields
        const missingFields = [];
        if (!(shapeData && shapeData.dataValues)) missingFields.push("Shape Data");
        if (!(colorData && colorData.dataValues)) missingFields.push("Color Data");
        if (!(clarityData && clarityData.dataValues)) missingFields.push("Clarity Data");
        if (!(labData && labData.dataValues)) missingFields.push("Lab Data");
        if (!(polishData && polishData.dataValues)) missingFields.push("Polish Data");
        if (!(symmetryData && symmetryData.dataValues)) missingFields.push("Symmetry Data");
        if (!(colorIntensityData && colorIntensityData.dataValues)) missingFields.push("Color Intensity Data");
        if (!(companyData && companyData.dataValues)) missingFields.push("Location Data");
        if (fluorescence) if (!(fluorescenceData && fluorescenceData.dataValues)) missingFields.push("fluorescence Data");

        // If there are missing fields, return an appropriate response
        if (missingFields.length > 0) {
            return resNotFound({
                data: missingFields.map((field) => prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", field]]))
            });
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
            measurement_height,
            measurement_width,
            measurement_depth,
            local_location,
            table_value: table_value,
            depth_value: depth_value,
            ratio: ratio,
            fluorescence: fluorescence,
            company_id: company_id,
            comments: comments,
            modified_by: session_res.id,
            modified_at: getLocalDate(),
        }, {
            where: {
                id: diamond.dataValues.id
            }
        })

        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const deleteStock = async (req: Request) => {
    try {
        const { diamond_id } = req.params

        const findDiamond = await Diamonds.findOne({
            where: {
                id: diamond_id,
                is_deleted: DeleteStatus.No,
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
            deleted_by: req.body.session_res.id,
        }, {
            where: {
                id: findDiamond.dataValues.id
            }
        })
        return resSuccess()
    } catch (error) {
        throw error;
    }
}

export const getStock = async (req: Request) => {
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
                "status",
                [Sequelize.literal(`"shape_master"."name"`), "shapeName"],
                [Sequelize.literal(`"shape_master"."id"`), "shapeId"],
                [Sequelize.literal(`"clarity_master"."name"`), "clarityName"],
                [Sequelize.literal(`"clarity_master"."id"`), "clarityId"],
                [Sequelize.literal(`"color_master"."name"`), "colorName"],
                [Sequelize.literal(`"color_master"."id"`), "colorId"],
                [Sequelize.literal(`"color_intensity_master"."name"`), "color_intensityName"],
                [Sequelize.literal(`"color_intensity_master"."id"`), "color_intensityId"],
                [Sequelize.literal(`"lab_master"."name"`), "labName"],
                [Sequelize.literal(`"lab_master"."id"`), "labId"],
                [Sequelize.literal(`"polish_master"."name"`), "polishName"],
                [Sequelize.literal(`"polish_master"."id"`), "polishId"],
                [Sequelize.literal(`"symmetry_master"."name"`), "symmetryName"],
                [Sequelize.literal(`"symmetry_master"."id"`), "symmetryId"],
                [Sequelize.literal(`"fluorescence_master"."name"`), "fluorescenceName"],
                [Sequelize.literal(`"fluorescence_master"."id"`), "fluorescenceId"],
                [Sequelize.literal(`"company_master"."name"`), "companyName"],
                [Sequelize.literal(`"company_master"."id"`), "companyId"],
                "quantity",
                "weight",
                "rate",
                "report",
                "video",
                "image",
                "certificate",
                "measurement_height",
                "measurement_width",
                "measurement_depth",
                "table_value",
                "depth_value",
                "ratio",
                "user_comments",
                "admin_comments",
                "local_location",
                "is_active"
            ],
            include: [
                {
                    model: Master,
                    as: "shape_master",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "color_master",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "color_intensity_master",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "clarity_master",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "lab_master",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "polish_master",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "symmetry_master",
                    attributes: [],
                },
                {
                    model: Master,
                    as: "fluorescence_master",
                    attributes: [],
                },
                {
                    model: Company,
                    as: "company_master",
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

export const getAllStock = async (req: Request) => {
    try {
        const { query } = req;
        let paginationProps = {};
        let pagination = {
            ...getInitialPaginationFromQuery(query),
            search_text: query.search_text,
        };
        let noPagination = req.query.no_pagination === "1";

        const where = [
            { is_deleted: DeleteStatus.No },
            req.body.session_res.id_role == 0 ? {} : { company_id: req.body.session_res.company_id },
            pagination.is_active ? { is_active: pagination.is_active } : {},
            pagination.search_text
                ? {
                    [Op.or]: [
                        { stock_id: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { status: { [Op.iLike]: `%${pagination.search_text}%` } },
                        {
                            [Op.and]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('quantity'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        {
                            [Op.and]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('weight'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        {
                            [Op.and]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('rate'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        {
                            [Op.and]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('report'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        {
                            [Op.and]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('table_value'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        {
                            [Op.and]: [
                                Sequelize.where(
                                    Sequelize.cast(Sequelize.col('depth_value'), 'TEXT'),
                                    { [Op.iLike]: `%${pagination.search_text}%` }
                                )
                            ]
                        },
                        { measurement: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { ratio: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { user_comments: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { admin_comments: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { email: { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$shape_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$color_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$color_intensity_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$clarity_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$lab_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$polish_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$symmetry_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$company_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                        { '$fluorescence_master.name$': { [Op.iLike]: `%${pagination.search_text}%` } },
                    ],
                }
                : {},
        ];

        const includes = [
            {
                model: Master,
                as: "shape_master",
                attributes: [],
            },
            {
                model: Master,
                as: "color_master",
                attributes: [],
            },
            {
                model: Master,
                as: "color_intensity_master",
                attributes: [],
            },
            {
                model: Master,
                as: "clarity_master",
                attributes: [],
            },
            {
                model: Master,
                as: "lab_master",
                attributes: [],
            },
            {
                model: Master,
                as: "polish_master",
                attributes: [],
            },
            {
                model: Master,
                as: "symmetry_master",
                attributes: [],
            },
            {
                model: Master,
                as: "fluorescence_master",
                attributes: [],
            },
            {
                model: Company,
                as: "company_master",
                attributes: [],
            },
        ]


        if (!noPagination) {
            const totalItems = await Diamonds.count({
                where,
                include: includes,
            });

            if (totalItems === 0) {
                return resSuccess({ data: { pagination, result: [] } });
            }

            pagination.total_items = totalItems;
            pagination.total_pages = Math.ceil(totalItems / pagination.per_page_rows);

            paginationProps = {
                limit: pagination.per_page_rows,
                offset: (pagination.current_page - 1) * pagination.per_page_rows,
            };
        }


        const DiamondsData = await Diamonds.findAll({
            where,
            ...paginationProps,
            order: [[pagination.sort_by, pagination.order_by]],
            attributes: [
                "id",
                "stock_id",
                "status",
                [Sequelize.literal(`"shape_master"."name"`), "shapeName"],
                [Sequelize.literal(`"shape_master"."id"`), "shapeId"],
                [Sequelize.literal(`"clarity_master"."name"`), "clarityName"],
                [Sequelize.literal(`"clarity_master"."id"`), "clarityId"],
                [Sequelize.literal(`"color_master"."name"`), "colorName"],
                [Sequelize.literal(`"color_master"."id"`), "colorId"],
                [Sequelize.literal(`"color_intensity_master"."name"`), "color_intensityName"],
                [Sequelize.literal(`"color_intensity_master"."id"`), "color_intensityId"],
                [Sequelize.literal(`"lab_master"."name"`), "labName"],
                [Sequelize.literal(`"lab_master"."id"`), "labId"],
                [Sequelize.literal(`"polish_master"."name"`), "polishName"],
                [Sequelize.literal(`"polish_master"."id"`), "polishId"],
                [Sequelize.literal(`"symmetry_master"."name"`), "symmetryName"],
                [Sequelize.literal(`"symmetry_master"."id"`), "symmetryId"],
                [Sequelize.literal(`"fluorescence_master"."name"`), "fluorescenceName"],
                [Sequelize.literal(`"fluorescence_master"."id"`), "fluorescenceId"],
                [Sequelize.literal(`"company_master"."name"`), "companyName"],
                [Sequelize.literal(`"company_master"."id"`), "companyId"],
                "quantity",
                "weight",
                "rate",
                "report",
                "video",
                "image",
                "certificate",
                "measurement_height",
                "measurement_width",
                "measurement_depth",
                "table_value",
                "depth_value",
                "ratio",
                "user_comments",
                "admin_comments",
                "local_location",
                "is_active"
            ],
            include: includes,
        });
        return resSuccess({
            data: noPagination ? { result: DiamondsData } : { pagination, result: DiamondsData }
        })
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const updateStockStatus = async (req: Request) => {
    try {
        const { diamond_id } = req.params

        const findDiamond = await Diamonds.findOne({
            where: {
                id: diamond_id,
                is_deleted: DeleteStatus.No,
            },
        })

        if (!(findDiamond && findDiamond.dataValues)) {
            return resNotFound({
                message: prepareMessageFromParams(ERROR_NOT_FOUND, [["field_name", "Diamond"]])
            })
        }

        await Diamonds.update({
            is_active: findDiamond.dataValues.is_active === ActiveStatus.InActive ? ActiveStatus.Active : ActiveStatus.InActive
        }, {
            where: {
                id: findDiamond.dataValues.id,
            },
        })

        return resSuccess({ message: RECORD_UPDATE })

    } catch (error) {
        throw error
    }
}