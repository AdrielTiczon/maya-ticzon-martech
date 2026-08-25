import type { Pool } from "pg";

export class BaseRepository {
  protected readonly db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }
}
