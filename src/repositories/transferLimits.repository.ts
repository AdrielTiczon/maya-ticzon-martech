import { BaseRepository, type DbTypes } from "#repositories/base.repository";

export type GetUserTransferIdPayload = {
  userId: string;
  lock?: boolean;
  db?: DbTypes;
};

type TransferLimits = {
  id: string;
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: Date;
  updatedAt: Date;
};

export class TransferLimitsRepository extends BaseRepository {
  async getUserTransferLimits({
    userId,
    lock = false,
    db = this.db,
  }: GetUserTransferIdPayload): Promise<Pick<
    TransferLimits,
    "dailyLimit" | "monthlyLimit"
  > | null> {
    // FOR UPDATE only holds for the life of a transaction. On the pool the
    // lock is released the instant the statement ends, which would silently
    // remove the protection rather than failing loudly.
    if (lock && db === this.db) {
      throw new Error(
        "getUserTransferLimits: lock:true requires a transaction client",
      );
    }

    const { rows } = await db.query(
      `SELECT user_id, daily_limit, monthly_limit
		   FROM transfer_limits
		  WHERE user_id = $1
		  ${lock ? "FOR UPDATE" : ""}`,
      [userId],
    );

    if (!rows[0]) return null;

    return {
      dailyLimit: Number(rows[0].daily_limit),
      monthlyLimit: Number(rows[0].monthly_limit),
    };
  }
}
