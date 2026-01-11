import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";

import userRouter from "./routes/userRoute.js";
import globalErrorHandler from "./middleware/globalErrorHandler.js";

dotenv.config({ path: "./.env" });

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware to parse JSON bodies
app.use(express.json());

//route
app.use("/api/v1/users", userRouter);
app.use(globalErrorHandler);

export default app;
