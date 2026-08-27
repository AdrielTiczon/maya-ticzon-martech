import { Router, type Request, type Response } from "express";
import { TransactionsService } from "#services";
import {
  historyQuerySchema,
  sendSchema,
  type HistoryQueryInput,
  type SendInput,
} from "#schemas";
import { validate } from "#middlewares";
import {
  presentTransaction,
  presentTransactionHistory,
  presentUsage,
} from "#presenters";

const transactionsController = Router();
const transactionsService = new TransactionsService();

// Transaction history
transactionsController.get(
  "/",
  validate(historyQuerySchema, "query"),
  async (req: Request, res: Response) => {
    const { direction, limit, offset } = req.validated!
      .query as HistoryQueryInput;

    const result = await transactionsService.getHistoryByUser(
      req.userId!,
      direction,
      limit,
      offset,
    );

    res.status(200).send(presentTransactionHistory(result));
  },
);

// Transactions daily/monthly usage
transactionsController.get("/usage", async (req, res) => {
  const usage = await transactionsService.getUsage(req.userId!);
  res.status(200).send(presentUsage(usage));
});

// Transfer money
transactionsController.post(
  "/",
  validate(sendSchema),
  async (req: Request, res: Response) => {
    const { receiverMobileNumber, amount } = req.validated!.body as SendInput;
    const result = await transactionsService.sendMoney(
      req.userId!,
      receiverMobileNumber,
      amount,
    );

    res.status(201).send(presentTransaction(result));
  },
);

export default transactionsController;
