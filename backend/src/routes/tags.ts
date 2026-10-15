import { Router } from "express";
import { TagHandler } from "../handlers/tags";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TagColor:
 *       type: string
 *       enum: [blue, teal, emerald, amber, orange, red, pink, violet, slate, lime]
 *     TagInput:
 *       type: object
 *       required:
 *         - name
 *         - color
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 30
 *           description: Unique per user, ignoring capital letters
 *           example: "Groceries"
 *         color:
 *           $ref: '#/components/schemas/TagColor'
 *     Tag:
 *       allOf:
 *         - $ref: '#/components/schemas/TagInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 * /tags:
 *   get:
 *     tags: [Tags]
 *     summary: List the tags of the logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The user's tags, alphabetical
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 *       '401':
 *         description: Unauthorized
 *   post:
 *     tags: [Tags]
 *     summary: Create a tag
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagInput'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       '400':
 *         description: Invalid name or color
 *       '401':
 *         description: Unauthorized
 *       '409':
 *         description: The user already has a tag with that name
 */
router.route("/").get(TagHandler.getTags).post(TagHandler.createTag);

/**
 * @swagger
 * /tags/{id}:
 *   delete:
 *     tags: [Tags]
 *     summary: Delete a tag (it is removed from every transaction that had it)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tag ID
 *     responses:
 *       '204':
 *         description: Deleted
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Tag not found
 */
router.route("/:id").delete(TagHandler.deleteTag);

export default router;
