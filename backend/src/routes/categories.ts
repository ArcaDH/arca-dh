import { Router } from "express";
import { CategoryHandler } from "../handlers/categories";
import { SubcategoryHandler } from "../handlers/subcategories";

const router = Router();

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
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
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       '400':
 *         description: Invalid input data
 *       '404':
 *         description: Category not found
 *       '401':
 *         description: Unauthorized
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category
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
 *         description: Category not found
 *       '401':
 *         description: Unauthorized
 */
router.route("/:id").put(CategoryHandler.updateCategory).delete(CategoryHandler.deleteCategory);

/**
 * @swagger
 * /categories/{id}/subcategories:
 *   get:
 *     tags: [Subcategories]
 *     summary: List subcategories of a category
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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subcategory'
 *       '404':
 *         description: Category not found
 *       '401':
 *         description: Unauthorized
 *   post:
 *     tags: [Subcategories]
 *     summary: Add a subcategory
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
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subcategory'
 *       '400':
 *         description: Invalid input data
 *       '404':
 *         description: Category not found
 *       '401':
 *         description: Unauthorized
 */
router
  .route("/:id/subcategories")
  .get(SubcategoryHandler.getSubcategories)
  .post(SubcategoryHandler.createSubcategory);

export default router;
