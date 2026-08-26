import pool from "#database/pool";
import { withTransaction } from "#database/transaction";
import TransactionsRepository, {
  type CreatePayload,
} from "#repositories/transactions.repository";
import { TransferLimitsRepository } from "#repositories/transferLimits.repository";
import UsersRepository from "#repositories/users.repository";
import { badRequest, unprocessable } from "#utils/errors";

const transferLimitsRepository = new TransferLimitsRepository(pool);
const usersRepository = new UsersRepository(pool);
const transactionsRepository = new TransactionsRepository(pool);

export type Period = { limit: number; used: number; remaining: number };
export type LimitUsage = { daily: Period; monthly: Period };

export default class TransactionsService {
  async getHistoryByUser(
    userId: string,
    direction: "inbound" | "outbound",
    limit: number,
    offset: number,
  ) {
    const result = await transactionsRepository.getHistory({
      userId,
      direction,
      limit,
      offset,
    });

    return result;
  }

  async getUsage(userId: string): Promise<LimitUsage> {
    const usage = await transactionsRepository.getUsage(userId);
    const limits = await transferLimitsRepository.getUserTransferLimits({
      userId,
    });

    if (!limits) {
      throw unprocessable(
        "LIMITS_NOT_CONFIGURED",
        "No transfer limits are configured for this account.",
      );
    }

    return {
      daily: {
        limit: limits.dailyLimit!,
        used: usage.daily,
        remaining: limits.dailyLimit! - usage.daily,
      },
      monthly: {
        limit: limits.monthlyLimit!,
        used: usage.monthly,
        remaining: limits.monthlyLimit! - usage.monthly,
      },
    };
  }

  async sendMoney(senderId: string, receiverMobileNumber: string, amount: number) {
    // Request validity. Nothing here needs the lock, so fail before taking it.
    const receiver =
      await usersRepository.findByMobileNumber(receiverMobileNumber);

    if (!receiver) {
      throw badRequest(
        "INVALID_RECEIVER",
        "The receiver either doesn't exist or is invalid.",
      );
    }

    if (senderId === receiver.id) {
      throw badRequest("INVALID_REQUEST", "Self transfers are not allowed.");
    }

    // Only what must be atomic goes inside.
    return withTransaction(async (client) => {
      const limits = await transferLimitsRepository.getUserTransferLimits({
        userId: senderId,
        lock: true,
        db: client,
      });

      if (!limits) {
        throw unprocessable(
          "LIMITS_NOT_CONFIGURED",
          "No transfer limits are configured for this account.",
        );
      }

      const usage = await transactionsRepository.getUsage(senderId, client);

      // Caps are inclusive: a transfer landing exactly on the limit is allowed.
      if (usage.daily + amount > limits.dailyLimit) {
        throw unprocessable(
          "DAILY_LIMIT_EXCEEDED",
          "The amount requested exceeds your remaining daily limit.",
        );
      }

      if (usage.monthly + amount > limits.monthlyLimit) {
        throw unprocessable(
          "MONTHLY_LIMIT_EXCEEDED",
          "The amount requested exceeds your remaining monthly limit.",
        );
      }

      return transactionsRepository.create(
        { senderId, receiverId: receiver.id, amount },
        client,
      );
    });
  }
}
