import { UsersRepository } from "../repositories/users.repository.js";
import pool from "../database/pool.ts";

const usersRepository = new UsersRepository(pool);

export default class UsersService {
  async getUser(id: string) {
    const user = await usersRepository.findById(id);
    return user;
  }
}
