// src/routes/userRoutes.js
/**
 * Routes for user profile management.
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { updateCurrentUser } from "../controllers/userController.js";

const router = Router();

router.patch("/me", requireAuth, updateCurrentUser);

export default router;
