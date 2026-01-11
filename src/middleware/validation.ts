// middlewares/validate.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodObject, ZodRawShape } from "zod";

const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      next(err);  
    }
  };

export default validate;
