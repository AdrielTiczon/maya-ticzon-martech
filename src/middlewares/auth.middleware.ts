import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "#services/token.service";
import { unauthorized } from "#utils/errors";

export function jwtAuthMiddleware(
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
