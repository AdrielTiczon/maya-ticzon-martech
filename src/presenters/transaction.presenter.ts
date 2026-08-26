import type { Transaction } from "../repositories/transactions.repository.ts";
import type { LimitUsage, Period } from "../services/transactions.service.ts";
import { toDecimalString } from "../utils/money.ts";

export type TransactionResponse = {
  id: string;
  senderId: string;
  receiverId: string;
  amount: string;
  currency: "PHP";
  createdAt: string;
};

type Amounts = { daily: number; monthly: number };

export type UsageInput = {
  usage: Amounts;
  remainingBudget: Amounts;
  limits: Amounts;
};

export type PeriodResponse = {
  limit: string;
  used: string;
  remaining: string;
};

export type UsageResponse = {
  currency: "PHP";
  daily: PeriodResponse;
  monthly: PeriodResponse;
};

export function presentTransaction(
  transaction: Transaction,
): TransactionResponse {
  return {
    id: transaction.id,
    senderId: transaction.senderId,
    receiverId: transaction.receiverId,
    amount: toDecimalString(transaction.amount),
    currency: "PHP",
    createdAt: transaction.createdAt.toISOString(),
  };
}

export function presentTransactionHistory(result: {
  data: Transaction[];
  hasMore: boolean;
}) {
  return {
    data: result.data.map(presentTransaction),
    pagination: { hasMore: result.hasMore },
  };
}

const presentPeriod = (period: Period) => ({
  limit: toDecimalString(period.limit),
  used: toDecimalString(period.used),
  remaining: toDecimalString(period.remaining),
});

export function presentUsage(usage: LimitUsage) {
  return {
    currency: "PHP",
    daily: presentPeriod(usage.daily),
    monthly: presentPeriod(usage.monthly),
  };
}
