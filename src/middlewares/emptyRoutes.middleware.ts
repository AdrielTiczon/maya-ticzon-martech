import type { Request, Response } from "express";

export default function emptyRoutesMiddleware(_req: Request, res: Response) {
  res.status(404).send({
    code: "NOT_FOUND",
    message: "Resource not found.",
  });
}
