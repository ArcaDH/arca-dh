import { BudgetPlanModel } from "../db/schema";
import { NotFoundError } from "../errors";
import { BudgetPlanInput } from "../models/budgetPlan.model";
import { budgetPlansRepository } from "../repositories/budgetPlans.repository";
import { usersRepository } from "../repositories/users.repository";

const planNotFound = () => new NotFoundError("Budget plan not found.");

export const budgetPlansService = {
  list: (userId: number): Promise<BudgetPlanModel[]> => budgetPlansRepository.findByUser(userId),

  async get(id: string, userId: number): Promise<BudgetPlanModel> {
    const plan = await budgetPlansRepository.findById(id, userId);
    if (!plan) throw planNotFound();
    return plan;
  },

  async create(input: BudgetPlanInput, userId: number): Promise<BudgetPlanModel> {
    const plan = await budgetPlansRepository.insert({ name: input.name, userId });
    const user = await usersRepository.findById(userId);
    if (!user?.currentPlanId) await usersRepository.setCurrentPlan(userId, plan.id); //sets it as current plan if the user has no plans
    return plan;
  },

  async rename(id: string, input: BudgetPlanInput, userId: number): Promise<BudgetPlanModel> {
    const plan = await budgetPlansRepository.update(id, userId, { name: input.name });
    if (!plan) throw planNotFound();
    return plan;
  },

  async remove(id: string, userId: number): Promise<void> {
    const plan = await budgetPlansRepository.delete(id, userId);
    if (!plan) throw planNotFound();
  },

  async setCurrent(planId: string, userId: number): Promise<BudgetPlanModel> {
    const plan = await budgetPlansService.get(planId, userId);
    await usersRepository.setCurrentPlan(userId, plan.id);
    return plan;
  },
};
