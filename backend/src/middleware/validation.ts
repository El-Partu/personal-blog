import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/** Validate and coerce `req.body` against a Zod schema. */
export const validateBody =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };

/** Validate and coerce `req.query` (all values arrive as strings). */
export const validateQuery =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(result.error);
    // Express 5 exposes `req.query` via a getter, so attach the parsed copy.
    Object.defineProperty(req, "validatedQuery", {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };

export default validateBody;
