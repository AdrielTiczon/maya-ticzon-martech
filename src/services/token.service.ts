import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("Missing required env var: JWT_SECRET");

const ALGORITHM = "HS256" as const;
const ISSUER = process.env.JWT_ISSUER ?? "maya-remittance";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export type AccessTokenPayload = { sub: string };

export function signAccessToken(userId: string): string {
  return jwt.sign({}, JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: userId, // -> "sub" claim, read back by the auth middleware
    issuer: ISSUER,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    jwtid: crypto.randomUUID(), // -> "jti", so a single token can be revoked later
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: [ALGORITHM], // must be pinned, see below
    issuer: ISSUER,
  }) as AccessTokenPayload;
}
