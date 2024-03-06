import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorMiddleware";
import * as dotenv from "dotenv";
import authRoute from "./routes/authRoute";
import projectRoute from "./routes/projectRoutes";
import "express-async-errors"; // <---------- apply async error patch
import Redis from "ioredis";
import { Socket } from "socket.io";
const { Server } = require("socket.io");

dotenv.config();

const app = express();

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const subscriber = new Redis(process.env.REDIS_URL as string);

io.listen(8002, () => {
  console.log("Socket.io server running on port 8002");
});

io.on("connection", (socket: Socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("subscribed", channel);
  });
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/projects", projectRoute);

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

async function initRedisSubscribe() {
  console.log("Subscribe to logs");
  subscriber.psubscribe("logs:*");
  subscriber.on(
    "pmessage",
    (pattern: any, channel: string, message: string) => {
      io.to(channel).emit("message", message);
    }
  );
}

initRedisSubscribe();

app.listen(8000);
