import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

type ResponseError = {
  statusCode: number;
  code: string;
  message: string;
};

export default function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Backstop for any bare `.parse()` that is not behind the validate middleware.
  // Without this a schema failure falls through as an opaque 500.
  if (err instanceof ZodError) {
    const message = err.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");

    res.status(400).send({ code: "VALIDATION_ERROR", message });
    return;
  }

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

  // Only unexpected failures are worth logging. Expected 4xx responses are
  // normal traffic; an unhandled 500 is the one that needs a trace.
  if (statusCode >= 500) {
    console.error("[ERROR]", req.method, req.originalUrl, err);
  }

  res.status(statusCode).send(errorMessage);
}
