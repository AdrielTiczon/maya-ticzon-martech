import { Router, type Request, type Response } from "express";
import TransactionsService from "../services/transactions.service.ts";
import { sendSchema } from "../schemas/transactions.schema.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { presentTransaction } from "../presenters/transaction.presenter.ts";

const transactionsController = Router();
const transactionsService = new TransactionsService();

// Get transaction history
transactionsController.get("/", async (req: Request, res: Response) => {
  const result = await transactionsService.getHistoryByUser(
    req.userId!,
    req.query.direction as "inbound" | "outbound",
    Number(req.query.limit ?? 20),
    Number(req.query.offset ?? 0),
  );

  res.status(200).send(result);
});

// Get usage
transactionsController.get("/usage", async (req: Request, res: Response) => {
  const result = await transactionsService.getUsage(req.userId!);

  res.status(200).send(result);
});

// Creating the transactions
transactionsController.post(
  "/",
  validate(sendSchema),
  async (req: Request, res: Response) => {
    const { receiverMobileNumber, amount } = req.validated!.body;
    const result = await transactionsService.send(
      req.userId!,
      receiverMobileNumber,
      amount,
    );

    res.status(200).send(presentTransaction(result));
  },
);

export default transactionsController;
