import { Router } from "express";
import { MonthlyPaymentHandler } from "../handlers/monthlyPayments";

const router = Router();

/**
 * @swagger
 * /monthly-payments/{id}:
 *   delete:
 *     tags: [Monthly payments]
 *     summary: Stop a monthly payment
 *     description: The transactions it already made are kept. No new ones are made.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Monthly payment ID
 *     responses:
 *       '204':
 *         description: Stopped
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Monthly payment not found
 */
router.route("/:id").delete(MonthlyPaymentHandler.deleteMonthlyPayment);

export default router;
