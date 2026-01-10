import type { Request, Response, NextFunction } from "express";
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
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};


function sendErrorDev(err: MongoError, res: Response) {
  const error = normalizeError(err);

  res.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
}

function sendErrorProd(err: MongoError, res: Response) {
  const error = normalizeError(err);

  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  console.error("ERROR 💥", err);
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
}
