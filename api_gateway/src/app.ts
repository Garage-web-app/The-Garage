import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { router as homeRouter } from "./routers/home_router.js";
import errorHandler from "./utils/error_handler.js";

config();

const rawPort: string | undefined = process.env.GATEWAY_PORT;
const env: string | undefined = process.env.NODE_ENV;

if (!rawPort || isNaN(parseInt(rawPort))) {
    throw new Error("GATEWAY_PORT is not a number");
}

if (!env) {
    throw new Error("NODE_ENV is not defined");
}

const port: number = parseInt(rawPort);

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env === "development") {
    app.use(morgan("dev"));
}

app.use("/", homeRouter);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
