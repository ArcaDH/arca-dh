import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { IdParam } from "../models/common.model";
import {
  CreateTransactionInput,
  DeleteTransactionQuery,
  ListTransactionsQuery,
  MonthSummaryQuery,
} from "../models/transaction.model";
import { transactionsService } from "../services/transactions.service";

// Mounted at /transactions in app.ts; every route needs a logged-in user
export const transactionsController = Router().use(requireAuth);

transactionsController.get("/", async (req, res) => {
  res.json(await transactionsService.list(res.locals.userId, ListTransactionsQuery.parse(req.query)));
});

// These two come before "/:id" so "summary" and "form-options" aren't read as an id
transactionsController.get("/summary", async (req, res) => {
  const { month } = MonthSummaryQuery.parse(req.query);
  res.json(await transactionsService.monthTotal(res.locals.userId, month));
});

transactionsController.get("/form-options", async (_req, res) => {
  res.json(await transactionsService.formOptions(res.locals.userId));
});

transactionsController.post("/", async (req, res) => {
  res.status(201).json(await transactionsService.create(res.locals.userId, CreateTransactionInput.parse(req.body)));
});

transactionsController.delete("/:id", async (req, res) => {
  const id = IdParam.parse(req.params.id);
  const { stopRecurring } = DeleteTransactionQuery.parse(req.query);
  await transactionsService.remove(res.locals.userId, id, stopRecurring);
  res.status(204).end();
});
