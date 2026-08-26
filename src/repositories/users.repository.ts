import { BaseRepository } from "./base.repository.ts";

export default class UsersRepository extends BaseRepository {
  async findByMobileNumber(mobileNumber: string) {
    const { rows } = await this.db.query(
      "SELECT id, name, mobile_number FROM users WHERE mobile_number = $1",
      [mobileNumber],
    );
    console.log("repo", mobileNumber, { rows });
    return rows[0] ?? null;
  }

  async findById(id: string) {
    const { rows } = await this.db.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    return rows[0] ?? null;
  }
}
