import { RequestHandler } from "express";
import { callServiceMethod } from "../base.controller";
import { contactUs, getAllBlogs, getBlogDetail, getCurrency } from "../../services/user/user.service";
import { getUserDetail, updateUserDetail } from "../../services/user/profile.service";

export const contactUsFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, contactUs(req), "contactUsFn")
}

export const getCurrencyFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getCurrency(), "getCurrencyFn")
}

export const getUserDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getUserDetail(req), "getUserDetailFn")
} 

export const updateUserDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, updateUserDetail(req), "updateUserDetailFn")
} 

export const getAllBlogsFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getAllBlogs(req), "getAllBlogsFn")
}

export const getBlogDetailFn: RequestHandler = (req, res) => {
    callServiceMethod(req, res, getBlogDetail(req), "getBlogDetailFn")
}