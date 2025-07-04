import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import cors from "cors";
import morgan from "morgan";

config();

const port: string = process.env.PORT || "3000";
const env: string = process.env.NODE_ENV || "development";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env === "development") {
  app.use(morgan("dev"));
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
