import type { Request, Response } from "express";
import { notFound } from "#utils";

export default function emptyRoutesMiddleware(_req: Request, _res: Response) {
  throw notFound("NOT_FOUND", "Resource not found.");
}
