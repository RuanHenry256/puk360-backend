/**
 * Auth routes.
 * Registers authentication endpoints for login and registration.
 */
// src/routes/auth.js
import { Router } from "express";
import { login, register } from "../controllers/authController.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);

export default router;
