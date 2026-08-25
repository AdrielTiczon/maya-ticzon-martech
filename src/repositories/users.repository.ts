import { BaseRepository } from "./base.repository.ts";

export class UsersRepository extends BaseRepository {
  async findById(id: string) {
    const { rows } = await this.db.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    return rows[0] ?? null;
  }
}
