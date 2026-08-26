import type { Pool, PoolClient } from "pg";

export type DbTypes = Pool | PoolClient;
export class BaseRepository {
  protected readonly db: DbTypes;

  constructor(db: Pool) {
    this.db = db;
  }
}
