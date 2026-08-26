import { BaseRepository, type DbTypes } from "#repositories/base.repository";

export type User = {
  id: string;
  mobileNumber: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithAuth = User & { mpinHash: string };

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    mobileNumber: row.mobile_number as string,
    name: row.name as string,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

const PUBLIC_COLUMNS = "id, mobile_number, name, created_at, updated_at";

export default class UsersRepository extends BaseRepository {
  async findByMobileNumberForAuth(
    mobileNumber: string,
    db: DbTypes = this.db,
  ): Promise<UserWithAuth | null> {
    const { rows } = await db.query(
      `SELECT ${PUBLIC_COLUMNS}, mpin_hash FROM users WHERE mobile_number = $1`,
      [mobileNumber],
    );

    if (!rows[0]) return null;
    return { ...toUser(rows[0]), mpinHash: rows[0].mpin_hash as string };
  }

  async findByMobileNumber(
    mobileNumber: string,
    db: DbTypes = this.db,
  ): Promise<User | null> {
    const { rows } = await db.query(
      `SELECT ${PUBLIC_COLUMNS} FROM users WHERE mobile_number = $1`,
      [mobileNumber],
    );

    return rows[0] ? toUser(rows[0]) : null;
  }

  async findById(id: string, db: DbTypes = this.db): Promise<User | null> {
    const { rows } = await db.query(
      `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
      [id],
    );

    return rows[0] ? toUser(rows[0]) : null;
  }
}
