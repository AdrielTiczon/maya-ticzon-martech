import type { Request, Response } from "express";
import { notFound } from "#utils/errors";

export default function emptyRoutesMiddleware(_req: Request, _res: Response) {
  throw notFound("NOT_FOUND", "Resource not found.");
}
