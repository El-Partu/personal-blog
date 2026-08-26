import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncHandler<P = Record<string, string>, ResBody = unknown, ReqBody = unknown, Q = unknown> = (
  req: Request<P, ResBody, ReqBody, Q>,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/** Forward rejected promises to the global error handler. */
export default function catchAsync<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  Q = unknown,
>(handler: AsyncHandler<P, ResBody, ReqBody, Q>): RequestHandler<P, ResBody, ReqBody, Q> {
  return ((req, res, next) => {
    void handler(req as never, res as never, next).catch(next);
  }) as RequestHandler<P, ResBody, ReqBody, Q>;
}
