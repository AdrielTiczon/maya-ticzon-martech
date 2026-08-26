import argon2 from "argon2";
import pool from "../database/pool.ts";
import UsersRepository from "../repositories/users.repository.ts";
import { signAccessToken } from "./token.service.ts";
import { unauthorized } from "../utils/errors.ts";

const usersRepository = new UsersRepository(pool);

const DUMMY_MPIN_HASH = await argon2.hash("0000");

export default class AuthService {
  async login(mobileNumber: string, mpin: string) {
    const user = await usersRepository.findByMobileNumberForAuth(mobileNumber);

    const isValid = await argon2
      .verify(user?.mpinHash ?? DUMMY_MPIN_HASH, mpin)
      .catch(() => false);

    if (!user || !isValid) {
      throw unauthorized(
        "INVALID_CREDENTIALS",
        "Mobile number or MPIN is incorrect.",
      );
    }

    const { mpinHash, ...safeUser } = user;

    return { user: safeUser, accessToken: signAccessToken(user.id) };
  }
}
