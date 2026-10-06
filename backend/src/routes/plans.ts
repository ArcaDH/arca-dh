import { Router } from "express";
import { PlanHandler } from "../handlers/plans";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
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
 *           example: "123e4567-e89b-12d3-a456-426614174000"
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
router
  .route("/:planId")
  .get(PlanHandler.getPlanById)
  .put(PlanHandler.updatePlan)
  .delete(PlanHandler.deletePlan);

export default router;
