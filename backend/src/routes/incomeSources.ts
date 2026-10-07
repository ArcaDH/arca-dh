import { Router } from "express";
import { IncomeSourceHandler } from "../handlers/incomeSources";

const router = Router();

/**
 * @swagger
 * /income-sources/{id}:
 *   put:
 *     tags: [Income sources]
 *     summary: Update an income source
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
 *             $ref: '#/components/schemas/IncomeSourceInput'
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncomeSource'
 *       '400':
 *         description: Invalid input data
 *       '404':
 *         description: Income source not found
 *       '401':
 *         description: Unauthorized
 *   delete:
 *     tags: [Income sources]
 *     summary: Delete an income source
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
 *         description: Income source not found
 *       '401':
 *         description: Unauthorized
 */
router
  .route("/:id")
  .put(IncomeSourceHandler.updateIncomeSource)
  .delete(IncomeSourceHandler.deleteIncomeSource);

export default router;
