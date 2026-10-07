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
router
  .route("/:id")
  .put(SubcategoryHandler.updateSubcategory)
  .delete(SubcategoryHandler.deleteSubcategory);

export default router;
