import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { badRequest } from "../utils/errors.ts";

export function validate(schema: ZodType, source: "body" | "query" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".") || source}: ${issue.message}`)
        .join("; ");

      throw badRequest("VALIDATION_ERROR", message);
    }

    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}
