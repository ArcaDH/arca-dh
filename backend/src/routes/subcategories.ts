import { Router } from "express";
import { SubcategoryHandler } from "../handlers/subcategories";

const router = Router();

/**
 * @swagger
 * /subcategories/{id}:
 *   put:
 *     tags: [Subcategories]
 *     summary: Update a subcategory
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
 *             $ref: '#/components/schemas/SubcategoryInput'
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subcategory'
 *       '400':
 *         description: Invalid input data
 *       '404':
 *         description: Subcategory not found
 *       '409':
 *         description: A subcategory with that name already exists in this category
 *       '401':
 *         description: Unauthorized
 *   delete:
 *     tags: [Subcategories]
 *     summary: Delete a subcategory
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
 *         description: Subcategory not found
 *       '401':
 *         description: Unauthorized
 */
router.route("/:id").put(SubcategoryHandler.updateSubcategory).delete(SubcategoryHandler.deleteSubcategory);

/**
 * @swagger
 * /subcategories/{id}/assignments/{month}:
 *   put:
 *     tags: [Subcategories]
 *     summary: Set money assigned to a subcategory in a month
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: month
 *         required: true
 *         description: Month (YYYY-MM)
 *         schema:
 *           type: string
 *           example: "2026-10"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assigned]
 *             properties:
 *               assigned:
 *                 type: number
 *                 format: decimal
 *                 example: 2500.00
 *     responses:
 *       '200':
 *         description: Assignment saved
 *       '400':
 *         description: Invalid input or month
 *       '404':
 *         description: Subcategory not found
 *       '401':
 *         description: Unauthorized
 */
router.route("/:id/assignments/:month").put(SubcategoryHandler.setAssignment);

export default router;
