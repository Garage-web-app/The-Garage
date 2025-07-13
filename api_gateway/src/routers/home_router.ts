import {
    Router,
    type Request,
    type Response,
    type NextFunction,
} from "express";
import mqtt from "mqtt";
import { welcomeController } from "../controllers/welcome_controller.js";

const router: Router = Router();

router.get("/", welcomeController);

export { router };
