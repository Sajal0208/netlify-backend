import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorMiddleware";
import * as dotenv from "dotenv";
import authRoute from "./routes/authRoute";
import projectRoute from "./routes/projectRoutes";
import "express-async-errors"; // <---------- apply async error patch

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/projects", projectRoute);

app.use(errorHandler);

app.listen(3000);
