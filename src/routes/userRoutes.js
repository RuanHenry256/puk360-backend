// src/routes/userRoutes.js
/**
 * Routes for user profile management.
 *
 * @swagger
 * tags:
 *   - name: Users
 *     description: User profile management
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *       example:
 *         name: Jane Doe
 *         email: jane@example.com
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { updateCurrentUser } from "../controllers/userController.js";

const router = Router();

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch("/me", requireAuth, updateCurrentUser);

export default router;
