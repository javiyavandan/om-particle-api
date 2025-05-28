import { Router } from "express";
import customerApiRoute from "./customer-api.route";

export default () => {
    const app = Router();
    customerApiRoute(app);
    return app;
}