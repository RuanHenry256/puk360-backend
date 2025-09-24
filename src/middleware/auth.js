<<<<<<< HEAD
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({
      status: 'error',
      error: 'Access token required',
    });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'error',
        error: 'Invalid token',
      });
    }
    req.user = user;
    next();
  });
};
=======
/**
 * JWT authentication middleware.
 * Verifies Bearer tokens, attaches decoded user to req.user, or 401s.
 */
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, roles, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
>>>>>>> ca054b5 (Added LoginScreen functionality that uses the database connection to compare user input and to validate credentials. Added updates to controllers, routes, middleware and docs)
