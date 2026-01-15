import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface MongoError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: number;
  keyValue?: Record<string, string>;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: string;
}

function normalizeError(
  err: MongoError
): MongoError & { statusCode: number; status: string } {
  return {
    ...err,
    statusCode: err.statusCode || 500,
    status: err.status || "error",
  };
}

function handleCastErrorDB(err: MongoError):MongoError{
return  err;

}

function handleDuplicateFieldsDB(err: MongoError):MongoError{
return err;
}

function handleValidationErrorDB(err: MongoError):MongoError{
return err;
}

export default (
  err: MongoError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 🔹 Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      errors: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message };
    console.log("Error", error);
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};


function sendErrorDev(err: MongoError, res: Response) {
  // const error = normalizeError(err);

  res.status(err.statusCode || 500).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
}

function sendErrorProd(err: MongoError, res: Response) {
  // const error = normalizeError(err);

  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error("ERROR 💥", err);
  res.status(err.statusCode || 500).json({
    status: err.status,
    message: "Something went very wrong!",
  });
}
