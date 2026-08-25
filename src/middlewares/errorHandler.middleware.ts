import type { Request, Response, NextFunction } from "express";

type ResponseError = {
  statusCode: number;
  code: string;
  message: string;
};

export default function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let statusCode = 500;
  const errorMessage: { code: string; message: string } = {
    code: "internal server error",
    message: "Something went wrong. Please try again later.",
  };

  if (err.cause) {
    const cause = err.cause as ResponseError;
    statusCode = cause.statusCode;
    errorMessage.code = cause.code;
    errorMessage.message = cause.message;
  }

  res.status(statusCode).send(errorMessage);
}
