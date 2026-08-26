import argon2 from "argon2";
import pool from "../database/pool.ts";
import UsersRepository from "../repositories/users.repository.ts";
import { signAccessToken } from "./token.service.ts";
import { badRequest, unauthorized } from "../utils/errors.ts";
import { formatMobileNumber } from "../utils/formatMobileNumber.ts";

const usersRepository = new UsersRepository(pool);

// Precomputed once so an unknown mobile number costs the same as a wrong MPIN.
const DUMMY_MPIN_HASH = await argon2.hash("0000");

export default class AuthService {
  async login(mobileNumber: string, mpin: string) {
    if (typeof mobileNumber !== "string" || typeof mpin !== "string") {
      throw badRequest(
        "INVALID_PAYLOAD",
        "mobileNumber and mpin are required.",
      );
    }

    const msisdn = formatMobileNumber(mobileNumber);
    const user = await usersRepository.findByMobileNumber(msisdn);

    // Always run a verify, even with no user — otherwise response time leaks
    // which numbers are registered.
    const isValid = await argon2
      .verify(user?.mpinHash ?? DUMMY_MPIN_HASH, mpin)
      .catch(() => false);

    if (!user || !isValid) {
      throw unauthorized(
        "INVALID_CREDENTIALS",
        "Mobile number or MPIN is incorrect.",
      );
    }

    return {
      user: { id: user.id, name: user.name, mobileNumber: user.mobileNumber },
      accessToken: signAccessToken(user.id),
    };
  }
}
