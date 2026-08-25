import type { NextFunction, Request, Response } from "express";

export default function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.info("TODO: auth middleware");

  next();
}

export function apiKeyAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw new Error("UNAUTHORIZED");
  }

  next();
}
