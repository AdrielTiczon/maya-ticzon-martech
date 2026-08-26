import pool from "../database/pool.ts";
import { withTransaction } from "../database/transaction.ts";
import TransactionsRepository, {
  type CreatePayload,
} from "../repositories/transactions.repository.ts";
import { TransferLimitsRepository } from "../repositories/transferLimits.repository.ts";
import UsersRepository from "../repositories/users.repository.ts";
import { badRequest, unprocessable } from "../utils/errors.ts";

const transferLimitsRepository = new TransferLimitsRepository(pool);
const usersRepository = new UsersRepository(pool);
const transactionsRepository = new TransactionsRepository(pool);

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

  async getUsage(userId: string) {
    const usage = await transactionsRepository.getUsage(userId);
    const limits = await transferLimitsRepository.getUserTransferLimits({
      userId,
    });

    const remainingBudget = {
      daily: limits?.dailyLimit! - usage.daily,
      monthly: limits?.monthlyLimit! - usage.monthly,
    };

    const limitsFormatted = {
      daily: limits?.dailyLimit!,
      monthly: limits?.monthlyLimit!,
    };

    return { usage, remainingBudget, limits: limitsFormatted };
  }

  send(senderId: string, receiverMobileNumber: string, amount: number) {
    return withTransaction(async (client) => {
      const limits = await transferLimitsRepository.getUserTransferLimits({
        userId: senderId,
        lock: true,
        db: client,
      });
      if (!limits)
        throw unprocessable(
          "UNPROCESSABLE",
          "The sender has no limits configured.",
        );

      const usage = await transactionsRepository.getUsage(senderId, client);

      const newMonthlyUsage = usage.monthly + amount;
      if (newMonthlyUsage > limits.monthlyLimit!)
        throw unprocessable(
          "MONTHLY_LIMIT_EXCEEDED",
          "You amount you requested exceeds your monthly request.",
        );

      const newDailyUsage = usage.daily + amount;
      console.log({ newDailyUsage });
      if (newDailyUsage > limits.dailyLimit!)
        throw unprocessable(
          "DAILY_LIMIT_EXCEEDED",
          "You amount you requested exceeds your daily request.",
        );

      const receiver =
        await usersRepository.findByMobileNumber(receiverMobileNumber);
      if (!receiver)
        throw badRequest(
          "INVALID_RECEIVER",
          `The receiver either doesn't exist or is invalid.`,
        );
      if (senderId === receiver.id)
        throw badRequest("INVALID_REQUEST", `Self transfers are not allowed.`);

      const transaction: CreatePayload = {
        senderId,
        receiverId: receiver.id,
        amount,
      };
      const result = await transactionsRepository.create(transaction, client);

      return result;
    });
  }
}
