import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/token.service.ts";
import { unauthorized } from "../utils/errors.ts";

export default function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.access_token;
  if (!token)
    throw unauthorized(
      "UNAUTHORIZED",
      "You are not allowed to access this resource.",
    );

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    throw unauthorized(
      "UNAUTHORIZED",
      "You are not allowed to access this resource.",
    );
  }
}

export function apiKeyAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw unauthorized(
      "UNAUTHORIZED",
      "You are not allowed to access this resource.",
    );
  }

  next();
}
