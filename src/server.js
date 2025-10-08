// src/server.js
/**
 * Express server entry point.
 * Loads env, configures CORS/JSON, registers routes, includes health/diag
 * endpoints, authenticates Sequelize, and starts the HTTP server.
 */
import dotenv from "dotenv";
// Load env BEFORE anything else that might read it
dotenv.config();

import authRoutes from './routes/authRoutes.js'; 
import eventRoutes from './routes/eventRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import rsvpRoutes from './routes/rsvpRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRequestRoutes from './routes/eventRequestRoutes.js';

import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './swagger.js';
import express from "express";
import cors from "cors";

// import sequelize from "./config/config.cjs";
import User from "./models/User.js"; // Example model

import Event_Attendees from './models/EventAttendees.js';

import sequelize from "./config/db.js";        // your Sequelize instance
import { getSqlPool, sql } from "./db/sql.js"; // mssql pool + types (for diag route)

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));


// CORS + JSON
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", reviewRoutes); // (as you had it)
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use('/api/events', rsvpRoutes);
app.use('/api/host-applications', eventRequestRoutes);

// Root route (so "/" doesn't show "Cannot GET /")
app.get("/", (_req, res) => {
  res.send("PUK360 API is running 🚀  Try GET /api/health");
});

// Health route that also checks DB reachability (via Sequelize)
app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await sequelize.query("SELECT 1 AS ok;");
    const dbOk = Array.isArray(rows) && rows[0]?.ok === 1;
    res.json({ ok: true, db: !!dbOk });
  } catch (err) {
    res.status(500).json({ ok: false, db: false, error: err.message });
  }
});

/**
 * Diagnostic route to confirm the exact DB the mssql pool hits,
 * and whether a given email/password matches using your seed's NVARCHAR hash format.
 * Remove this once you've confirmed things.
 * Example:
 *   GET /api/diag/auth-check?email=user24@example.com&pw=Password24
 */
app.get("/api/diag/auth-check", async (req, res) => {
  try {
    const email = req.query.email || "user24@example.com";
    const pw = req.query.pw || "Password24";

    const pool = await getSqlPool();

    // 1) Which DB are we on (from the mssql connection)?
    const db = await pool.request().query("SELECT DB_NAME() AS dbname");

    // 2) Does the email exist (trimmed, case-insensitive)?
    const exists = await pool
      .request()
      .input("email", sql.NVarChar(100), email)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM [User]
        WHERE LTRIM(RTRIM(Email)) = LTRIM(RTRIM(@email)) COLLATE SQL_Latin1_General_CP1_CI_AS
      `);


    // 3) Does the password match (seed format: NVARCHAR of HASHBYTES)?
    const match = await pool
      .request()
      .input("email", sql.NVarChar(100), email)
      .input("pw", sql.NVarChar(400), pw)
      .query(`
        SELECT CASE WHEN EXISTS (
          SELECT 1
          FROM [User]
          WHERE LTRIM(RTRIM(Email)) = LTRIM(RTRIM(@email)) COLLATE SQL_Latin1_General_CP1_CI_AS
            AND Password_Hash = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw))
        ) THEN 1 ELSE 0 END AS ok
      `);


    res.json({
      mssql_db: db.recordset[0].dbname,
      email,
      exists: exists.recordset[0].cnt,
      password_ok: match.recordset[0].ok,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Start server AFTER DB is confirmed (Sequelize path) ---
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Azure Database");
    await sequelize.sync(); // sync models (no destructive alters)
    console.log("✅ Database synced");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log(`Diag:   http://localhost:${PORT}/api/diag/auth-check`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message || error);
    process.exit(1); // fail fast if DB is down
  }
}

start();


