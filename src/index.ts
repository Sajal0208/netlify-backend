import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorMiddleware";
import "express-async-errors"; // <---------- apply async error patch

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", require("./routes/authRoute"));

app.use(errorHandler);

app.listen(3000);
