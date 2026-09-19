import "dotenv/config";
import http from "http";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { Env } from "./config/env.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDatabse from "./config/database.config";
import passport from "./config/passport.config";
import routes from "./routes";
import { initSocket } from "./sockets";

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(passport.initialize());

app.get(
  "/health",
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Server is Healthy",
      status: "Ok",
    });
  })
);

app.use("/api", routes);

app.use(errorHandler);

initSocket(server);

server.listen(Number(Env.PORT), "0.0.0.0", async () => {
  await connectDatabse();
  console.log(
    `Server running on port ${Env.PORT} in ${Env.NODE_ENV} mode`
  );
});
