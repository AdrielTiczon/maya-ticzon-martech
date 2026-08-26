import type { Pool, PoolClient } from "pg";
import { BaseRepository, type DbTypes } from "#repositories/base.repository";

export type CreatePayload = {
  senderId: string;
  receiverId: string;
  amount: number;
};

export type GetHistoryPayload = {
  userId: string;
  direction: "inbound" | "outbound";
  limit: number;
  offset: number;
};

export type Transaction = {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  createdAt: Date;
};

function toTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    senderId: row.sender_id as string,
    receiverId: row.receiver_id as string,
    amount: Number(row.amount),
    createdAt: row.created_at as Date,
  };
}

const PHT_DAY_START = `date_trunc('day', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila'`;
const PHT_MONTH_START = `date_trunc('month', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila'`;

type HistoryResponse = {
  data: Transaction[];
  hasMore: boolean;
};

export default class TransactionsRepository extends BaseRepository {
  async getHistory({
    userId,
    direction,
    limit = 50,
    offset = 0,
  }: GetHistoryPayload): Promise<HistoryResponse> {
    let scope = "(sender_id = $1 OR receiver_id = $1)";
    if (direction === "outbound") scope = "sender_id = $1";
    if (direction === "inbound") scope = "receiver_id = $1";

    const { rows } = await this.db.query(
      `SELECT id, sender_id, receiver_id, amount, created_at
       FROM transactions
      WHERE ${scope}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit + 1, offset],
    );
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    return { data: rows.map(toTransaction), hasMore };
  }
  async getUsage(userId: string, db: DbTypes = this.db) {
    const { rows } = await db.query(
      `SELECT
			   COALESCE(SUM(amount) FILTER (WHERE created_at >= ${PHT_DAY_START}), 0) AS daily,
			   COALESCE(SUM(amount), 0) AS monthly
			 FROM transactions
			 WHERE sender_id = $1
			   AND created_at >= ${PHT_MONTH_START}`,
      [userId],
    );

    return {
      daily: Number(rows[0].daily),
      monthly: Number(rows[0].monthly),
    };
  }

  async create(
    createPayload: CreatePayload,
    db: DbTypes = this.db,
  ): Promise<Transaction> {
    const { senderId, receiverId, amount } = createPayload;
    const { rows } = await db.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount)
       VALUES($1, $2, $3)
       RETURNING id, sender_id, receiver_id, amount, created_at`,
      [senderId, receiverId, amount],
    );

    return toTransaction(rows[0]);
  }
}
