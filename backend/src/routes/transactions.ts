import { Router } from "express";
import { TransactionHandler } from "../handlers/transactions";

const router = Router();

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     tags: [Transactions]
 *     summary: Update a transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       '400':
 *         description: Invalid transaction (mismatched category or goal)
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Transaction not found
 *   delete:
 *     tags: [Transactions]
 *     summary: Delete a transaction
 *     description: |
 *       With `stopRepeating=true`, a transaction made by a monthly payment also stops that payment, so no more are
 *       created. Without it, only this transaction is deleted and the month is not created again.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *       - in: query
 *         name: stopRepeating
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Also stop the monthly payment that made this transaction
 *     responses:
 *       '204':
 *         description: Deleted
 *       '400':
 *         description: Invalid query parameter
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Transaction not found
 */
router.route("/:id").put(TransactionHandler.updateTransaction).delete(TransactionHandler.deleteTransaction);

export default router;
