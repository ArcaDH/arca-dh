import { Router } from "express";
import { UserHandler } from "../handlers/users";

const router = Router();
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Registers a new user in the database after validation.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 example: "johndoe@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *     responses:
 *       201:
 *         description: User successfully created.
 *       400:
 *         description: Invalid data or user already exists.
 */
router.route('/').post(UserHandler.createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     description: Authenticates user credentials and returns a JWT token.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "johndoe@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful.
 *       400:
 *         description: Missing credentials.
 *       404:
 *         description: Invalid credentials or user not found.
 */
router.route('/login').post(UserHandler.connectUser);

/**
 * @swagger
 *  /users/{id}:
 *    patch:
 *      summary: Update a user
 *      description: Updates user details with optional fields.
 *      tags: 
 *        - Users
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *            example: "42"
 *          description: ID of the user to update
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                  example: "user@example.com"
 *                username:
 *                  type: string
 *                  example: "new_username"
 *                password:
 *                  type: string
 *                  example: "new_password123"
 *      responses:
 *        '200':
 *          description: User updated successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    example: "42"
 *                  email:
 *                    type: string
 *                    format: email
 *                    example: "user@example.com"
 *                  username:
 *                    type: string
 *                    example: "new_username"
 *        '400':
 *          description: Invalid request data
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  code:
 *                    type: integer
 *                    example: 400
 *                  message:
 *                    type: string
 *                    example: "Invalid input data"
 *        '401':
 *          description: Invalid or missing token
 *        '403':
 *          description: Not authorized to update this user
 *        '404':
 *          description: User not found
 */
router.route("/:id([0-9]+)*").patch(UserHandler.patchUser);

/**
 * @swagger
 *  /users/{id}:
 *    get:
 *      summary: Retrieve user details
 *      description: Retrieves profile information for a user.
 *      tags: 
 *        - Users
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *            example: "42"
 *          description: ID of the user to retrieve
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        '200':
 *          description: User details retrieved successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    example: "42"
 *                  username:
 *                    type: string
 *                    example: "user123"
 *                  email:
 *                    type: string
 *                    format: email
 *                    example: "user@example.com"
 *        '400':
 *          description: Invalid request
 *        '401':
 *          description: Invalid or missing token
 *        '404':
 *          description: User not found
 */
router.route("/:id([0-9]+)*").get(UserHandler.getUser);

export default router;