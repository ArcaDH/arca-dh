import { Router } from "express";
import { PlanHandler } from "../handlers/plans";
import { TransactionHandler } from "../handlers/transactions";
import { SavingsGoalHandler } from "../handlers/savingsGoals";
import { CategoryHandler } from "../handlers/categories";
import { IncomeSourceHandler } from "../handlers/incomeSources";
import { OverviewHandler } from "../handlers/overview";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionType:
 *       type: string
 *       enum: [EXPENSE, SAVING]
 *     TransactionInput:
 *       type: object
 *       required:
 *         - amount
 *         - date
 *         - type
 *       properties:
 *         amount:
 *           type: number
 *           format: decimal
 *           example: 42.50
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-09-15"
 *         description:
 *           type: string
 *           example: "Grocery shopping"
 *         type:
 *           $ref: '#/components/schemas/TransactionType'
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: Required for EXPENSE
 *         subcategoryId:
 *           type: string
 *           format: uuid
 *           description: Optional, must belong to the category
 *         savingsGoalId:
 *           type: string
 *           format: uuid
 *           description: Required for SAVING
 *     Transaction:
 *       allOf:
 *         - $ref: '#/components/schemas/TransactionInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *     SavingsGoalInput:
 *       type: object
 *       required:
 *         - name
 *         - targetAmount
 *       properties:
 *         name:
 *           type: string
 *           example: "Emergency Fund"
 *         targetAmount:
 *           type: number
 *           format: decimal
 *           example: 1000.00
 *         deadline:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2026-12-31"
 *         monthlyAmount:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: The planned amount to save each month
 *           example: 250.00
 *     SavingsGoal:
 *       allOf:
 *         - $ref: '#/components/schemas/SavingsGoalInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             savedAmount:
 *               type: number
 *               format: decimal
 *               readOnly: true
 *               example: 250.00
 *             progress:
 *               type: number
 *               format: double
 *               readOnly: true
 *               description: savedAmount / targetAmount (0 to 1)
 *               example: 0.25
 *     BudgetPlanInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "My 2026 Budget Plan"
 *         month:
 *           type: string
 *           example: "2026-10"
 *           description: Target month in YYYY-MM format. Defaults to current month if omitted. Must be current or future month.
 *     BudgetPlan:
 *       allOf:
 *         - $ref: '#/components/schemas/BudgetPlanInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             month:
 *               type: string
 *               example: "2026-10"
 *             current:
 *               type: boolean
 *               readOnly: true
 *               description: True if this is the user's current (default) plan
 *               example: true
 *     CurrentPlanInput:
 *       type: object
 *       required:
 *         - planId
 *       properties:
 *         planId:
 *           type: string
 *           format: uuid
 *     IncomeSourceInput:
 *       type: object
 *       required:
 *         - name
 *         - monthlyAmount
 *       properties:
 *         name:
 *           type: string
 *           example: "Salary"
 *         monthlyAmount:
 *           type: number
 *           format: decimal
 *           example: 2500.00
 *     IncomeSource:
 *       allOf:
 *         - $ref: '#/components/schemas/IncomeSourceInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     tags: [Plans]
 *     summary: List my budget plans
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BudgetPlan'
 *       '401':
 *         description: Unauthorized
 *   post:
 *     tags: [Plans]
 *     summary: Create a budget plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetPlanInput'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetPlan'
 *       '400':
 *         description: Invalid input data or month in the past
 *       '401':
 *         description: Unauthorized
 */
router.route("/").get(PlanHandler.getPlans).post(PlanHandler.createPlan);

/**
 * @swagger
 * /plans/current:
 *   get:
 *     tags: [Plans]
 *     summary: Get my current (default) plan
 *     description: The plan the user selected as their default view.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetPlan'
 *       '404':
 *         description: No current plan selected yet
 *       '401':
 *         description: Unauthorized
 *   put:
 *     tags: [Plans]
 *     summary: Select my current (default) plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CurrentPlanInput'
 *     responses:
 *       '200':
 *         description: Current plan updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetPlan'
 *       '404':
 *         description: Plan not found
 *       '401':
 *         description: Unauthorized
 */
router.route("/current").get(PlanHandler.getCurrentPlan).put(PlanHandler.setCurrentPlan);

/**
 * @swagger
 * /plans/{planId}:
 *   get:
 *     tags: [Plans]
 *     summary: Get a plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the plan to retrieve
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetPlan'
 *       '404':
 *         description: Plan not found
 *       '401':
 *         description: Unauthorized
 *   put:
 *     tags: [Plans]
 *     summary: Update a plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the plan to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetPlanInput'
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetPlan'
 *       '400':
 *         description: Invalid input data or month in the past
 *       '404':
 *         description: Plan not found
 *       '401':
 *         description: Unauthorized
 *   delete:
 *     tags: [Plans]
 *     summary: Delete a plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the plan to delete
 *     responses:
 *       '204':
 *         description: Deleted
 *       '404':
 *         description: Plan not found
 *       '401':
 *         description: Unauthorized
 */
router.route("/:planId").get(PlanHandler.getPlanById).put(PlanHandler.updatePlan).delete(PlanHandler.deletePlan);

/**
 * @swagger
 * /plans/{planId}/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions of a plan
 *     description: Sorted by date, newest first. Use `month` to get one month only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: month
 *         in: query
 *         description: Month to filter on (YYYY-MM)
 *         schema:
 *           type: string
 *           example: "2026-09"
 *       - name: categoryId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: type
 *         in: query
 *         schema:
 *           $ref: '#/components/schemas/TransactionType'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Plan not found
 *   post:
 *     tags: [Transactions]
 *     summary: Create a transaction
 *     description: |
 *       An EXPENSE needs a `categoryId` (and optionally a `subcategoryId`).
 *       A SAVING needs a `savingsGoalId`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       '400':
 *         description: Invalid transaction (missing category or goal, or mismatched fields)
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Plan not found
 */
router
  .route("/:planId/transactions")
  .get(TransactionHandler.getTransactions)
  .post(TransactionHandler.createTransaction);

/**
 * @swagger
 * /plans/{planId}/goals:
 *   get:
 *     tags: [Savings goals]
 *     summary: List savings goals with their progress
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SavingsGoal'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Plan not found
 *   post:
 *     tags: [Savings goals]
 *     summary: Create a savings goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SavingsGoalInput'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavingsGoal'
 *       '400':
 *         description: Invalid input data
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Plan not found
 */
router.route("/:planId/goals").get(SavingsGoalHandler.getGoals).post(SavingsGoalHandler.createGoal);

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *         - maxBudget
 *       properties:
 *         name:
 *           type: string
 *           example: "Food"
 *         maxBudget:
 *           type: number
 *           format: decimal
 *           example: 600.00
 *     Category:
 *       allOf:
 *         - $ref: '#/components/schemas/CategoryInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *     SubcategoryInput:
 *       type: object
 *       required:
 *         - name
 *         - limit
 *       properties:
 *         name:
 *           type: string
 *           example: "Restaurants"
 *         limit:
 *           type: number
 *           format: decimal
 *           example: 200.00
 *     Subcategory:
 *       allOf:
 *         - $ref: '#/components/schemas/SubcategoryInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 */

/**
 * @swagger
 * /plans/{planId}/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories of a plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       '404':
 *         description: Plan not found
 *       '401':
 *         description: Unauthorized
 *   post:
 *     tags: [Categories]
 *     summary: Create a category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       '400':
 *         description: Invalid input data
 *       '404':
 *         description: Plan not found
 *       '401':
 *         description: Unauthorized
 */
router.route("/:planId/categories").get(CategoryHandler.getCategories).post(CategoryHandler.createCategory);

/**
 * @swagger
 * /plans/{planId}/income-sources:
 *   get:
 *     tags: [Income sources]
 *     summary: List income sources of a plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IncomeSource'
 *       '404':
 *         description: Plan not found
 *       '401':
 *         description: Unauthorized
 *   post:
 *     tags: [Income sources]
 *     summary: Add an income source
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncomeSourceInput'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncomeSource'
 *       '400':
 *         description: Invalid input data
 *       '404':
 *         description: Plan not found
 *       '401':
 *         description: Unauthorized
 */
router
  .route("/:planId/income-sources")
  .get(IncomeSourceHandler.getIncomeSources)
  .post(IncomeSourceHandler.createIncomeSource);

/**
 * @swagger
 * components:
 *   schemas:
 *     CategorySpending:
 *       type: object
 *       properties:
 *         categoryId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         maxBudget:
 *           type: number
 *           format: decimal
 *         spent:
 *           type: number
 *           format: decimal
 *         subcategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               subcategoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               limit:
 *                 type: number
 *                 format: decimal
 *               spent:
 *                 type: number
 *                 format: decimal
 *     GoalProgress:
 *       type: object
 *       properties:
 *         goalId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         targetAmount:
 *           type: number
 *           format: decimal
 *         deadline:
 *           type: string
 *           format: date
 *         createdAt:
 *           type: string
 *           format: date-time
 *         monthlyAmount:
 *           type: number
 *           format: decimal
 *           nullable: true
 *         savedAmount:
 *           type: number
 *           format: decimal
 *         savedThisMonth:
 *           type: number
 *           format: decimal
 *           description: Saved toward the goal in the requested month
 *         progress:
 *           type: number
 *           format: double
 *     MonthlyOverview:
 *       type: object
 *       properties:
 *         month:
 *           type: string
 *           example: "2026-09"
 *         totalIncome:
 *           type: number
 *           format: decimal
 *         totalExpenses:
 *           type: number
 *           format: decimal
 *         remaining:
 *           type: number
 *           format: decimal
 *           description: totalIncome - totalExpenses - savings
 *         savings:
 *           type: number
 *           format: decimal
 *         spendingByCategory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategorySpending'
 *         goalProgress:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GoalProgress'
 */

/**
 * @swagger
 * /plans/{planId}/overview:
 *   get:
 *     tags: [Overview]
 *     summary: Monthly overview of a plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: month
 *         in: query
 *         required: true
 *         description: Month (YYYY-MM)
 *         schema:
 *           type: string
 *           example: "2026-09"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonthlyOverview'
 *       '400':
 *         description: Missing or invalid month parameter
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Plan not found
 */
router.route("/:planId/overview").get(OverviewHandler.getOverview);

export default router;
