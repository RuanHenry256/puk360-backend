// src/controllers/userController.js
/**
 * User controller for profile operations.
 * Allows authenticated students to update their own profile information.
 */
import { findUserByEmail, getUserRoles, updateUserProfile } from "../data/userRepo.js";

export async function updateCurrentUser(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, email } = req.body ?? {};
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim() : "";

    if (!trimmedName || !trimmedEmail) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    const existing = await findUserByEmail(trimmedEmail);
    if (existing && existing.User_ID !== userId) {
      return res.status(409).json({ error: "Email already in use." });
    }

    const updated = await updateUserProfile({ userId, name: trimmedName, email: trimmedEmail });
    if (!updated) {
      return res.status(404).json({ error: "User not found." });
    }

    const roles = await getUserRoles(userId);

    return res.json({
      user: {
        id: updated.User_ID,
        name: updated.Name,
        email: updated.Email,
        roles,
      },
    });
  } catch (error) {
    if (error?.code === "EMAIL_IN_USE") {
      return res.status(409).json({ error: "Email already in use." });
    }
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Failed to update profile." });
  }
}
