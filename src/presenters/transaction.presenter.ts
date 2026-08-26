import type { Transaction } from "../repositories/transactions.repository.ts";
import { toDecimalString } from "../utils/money.ts";

export type TransactionResponse = {
  id: string;
  senderId: string;
  receiverId: string;
  amount: string;
  currency: "PHP";
  createdAt: string;
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
