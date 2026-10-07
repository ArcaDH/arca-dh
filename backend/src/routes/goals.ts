import { Router } from "express";
import { SavingsGoalHandler } from "../handlers/savingsGoals";

const router = Router();

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     tags: [Savings goals]
 *     summary: Get a savings goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               $ref: '#/components/schemas/SavingsGoal'
 *       '404':
 *         description: Savings goal not found
 *       '401':
 *         description: Unauthorized
 *   put:
 *     tags: [Savings goals]
 *     summary: Update a savings goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavingsGoal'
 *       '400':
 *         description: Invalid input data
 *       '404':
 *         description: Savings goal not found
 *       '401':
 *         description: Unauthorized
 *   delete:
 *     tags: [Savings goals]
 *     summary: Delete a savings goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '204':
 *         description: Deleted
 *       '404':
 *         description: Savings goal not found
 *       '401':
 *         description: Unauthorized
 */
router
  .route("/:id")
  .get(SavingsGoalHandler.getGoalById)
  .put(SavingsGoalHandler.updateGoal)
  .delete(SavingsGoalHandler.deleteGoal);

export default router;
