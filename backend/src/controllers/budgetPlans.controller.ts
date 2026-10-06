import { CookieOptions, Router } from "express";
import { budgetPlansService } from "../services/budgetPlans.service";
import { requireAuth } from "../middleware/requireAuth";
import { BudgetPlanInput, CurrentPlanInput } from "../models/budgetPlan.model";

const budgetPlansController = Router();

budgetPlansController.use(requireAuth);

budgetPlansController.post("/plans", async (req, res) => {
  res.status(201).json(await budgetPlansService.create(BudgetPlanInput.parse(req.body), res.locals.userId));
});

budgetPlansController.get("/plans", async (_req, res) => {
  res.json(await budgetPlansService.list(res.locals.userId));
});

budgetPlansController.get("/plans/:id", async (req, res) => {
  res.json(await budgetPlansService.get(req.params.id, res.locals.userId));
});

budgetPlansController.patch("/plans/:id", async (req, res) => {
  res.json(await budgetPlansService.rename(req.params.id, BudgetPlanInput.parse(req.body), res.locals.userId));
});

budgetPlansController.delete("/plans/:id", async (req, res) => {
  await budgetPlansService.remove(req.params.id, res.locals.userId);
  res.status(204).end();
});

budgetPlansController.put("/me/current-plan", async (req, res) => {
  const { planId } = CurrentPlanInput.parse(req.body);
  res.json(await budgetPlansService.setCurrent(planId, res.locals.userId));
});
