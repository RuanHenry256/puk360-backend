// src/controllers/authController.js
/**
 * Authentication controller.
 * Handles user registration and login, delegates to userRepo for DB work,
 * and issues JWTs on success.
 */
import jwt from "jsonwebtoken";
import { getSqlPool, sql } from "../db/sql.js";
import {
  verifyUserByEmailPassword,
  createUserWithSqlHash,
  findUserByEmail,
  getUserRoles,
  ensureUserRole
} from "../data/userRepo.js";

/**
 * POST /api/auth/register
 * body: { name, email, password }
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required." });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered." });

    const userId = await createUserWithSqlHash({
      name,
      email,
      plainPassword: password,
      status: "Active"
    });

    // Assign default "Student" role (Role_ID = 1)
    try {
      await ensureUserRole(userId, 1);
    } catch (e) {
      console.error("Failed to assign default role to new user", e);
    }

    const roles = await getUserRoles(userId);
    const token = jwt.sign(
      { id: userId, email, roles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      token,
      user: { id: userId, name, email, roles }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * POST /api/auth/login
 * body: { email, password }
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    const user = await verifyUserByEmailPassword(email, password);
    if (!user) return res.status(400).json({ error: "Invalid credentials." });

    // Optional: enforce Active only
    // if (String(user.Status).toLowerCase() !== "active") {
    //   return res.status(403).json({ error: "Account inactive." });
    // }

    const roles = await getUserRoles(user.User_ID);
    // attach host status (if any)
    let hostStatus = null;
    try {
      const pool = await getSqlPool();
      const rs = await pool.request().input('uid', sql.Int, user.User_ID)
        .query(`SELECT TOP 1 Approval_Status, Activity_Status, Is_Active FROM dbo.Host_Profile WHERE User_ID=@uid`);
      hostStatus = rs.recordset?.[0] || null;
    } catch {}
    const token = jwt.sign(
      { id: user.User_ID, email: user.Email, roles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { id: user.User_ID, name: user.Name, email: user.Email, roles, hostStatus }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
