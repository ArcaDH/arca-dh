# Swagger UI with Express Usage Guide

Swagger UI allows developers to visualize and interact with the API endpoints. This guide explains how to document an Express API using Swagger JSDoc annotations.

---

### **Route Definitions with Swagger JSDoc**

Swagger parses JSDoc comments to generate API documentation. Each route should be annotated with specific metadata to be rendered correctly in Swagger UI.

#### **GET Route Example**

Here is how to document a GET route retrieving a user list:

```typescript
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve user list
 *     description: Returns an array containing registered user information.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Success - User list retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 */
router.get("/users", (req, res) => {
    res.json([{ id: 1, name: "John Doe" }]);
});
```

#### **POST Route Example**

For a route creating a new user:

```typescript
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Registers a new user and returns their information.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *     responses:
 *       201:
 *         description: User successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 name:
 *                   type: string
 *                   example: "Jane Doe"
 */
router.post("/users", (req, res) => {
    const newUser = { id: 2, name: req.body.name };
    res.status(201).json(newUser);
});
```

#### **Route Parameters Example**

To document URL path parameters, use the `parameters` key:

```typescript
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns details for a specific user.
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Success - User details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *       404:
 *         description: User not found.
 */
router.get("/users/:id", (req, res) => {
    const user = { id: req.params.id, name: "John Doe" };
    res.json(user);
});
```

#### **Conclusion**

Adding JSDoc Swagger annotations enables Swagger UI to display interactive documentation for your API endpoints, making it easier for developers to consume the API.
