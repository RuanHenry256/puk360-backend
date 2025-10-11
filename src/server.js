// src/server.js
/**
 * Express server entry point.
 * Loads env, configures CORS/JSON, registers routes, includes health/diag
 * endpoints, authenticates Sequelize, and starts the HTTP server.
 */

import dotenv from "dotenv";
dotenv.config();

import authRoutes from './routes/authRoutes.js'; 
import eventRoutes from './routes/eventRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import rsvpRoutes from './routes/rsvpRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRequestRoutes from './routes/eventRequestRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';
import express from "express";
import cors from "cors";
import sequelize from "./config/db.js"; // Your Sequelize instance
import { getSqlPool, sql } from "./db/sql.js"; // mssql pool + types

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
app.use("/api", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use('/api/events', rsvpRoutes);
app.use('/api/host-applications', eventRequestRoutes);

// Users endpoint to get active users
app.get("/api/users", async (req, res) => {
  try {
    const pool = await getSqlPool();
    
    // Query to fetch active users
    const result = await pool.request().query(`
      SELECT User_ID, Name, Email 
      FROM [User] 
      WHERE Status = 'Active'
    `);

    // Send the user data as JSON
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Root route
app.get("/", (_req, res) => {
  res.send("PUK360 API is running 🚀  Try GET /api/health");
});

// Health route
app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await sequelize.query("SELECT 1 AS ok;");
    const dbOk = Array.isArray(rows) && rows[0]?.ok === 1;
    res.json({ ok: true, db: !!dbOk });
  } catch (err) {
    res.status(500).json({ ok: false, db: false, error: err.message });
  }
});

// Diagnostic route
app.get("/api/diag/auth-check", async (req, res) => {
  try {
    const email = req.query.email || "user24@example.com";
    const pw = req.query.pw || "Password24";

    const pool = await getSqlPool();

    const db = await pool.request().query("SELECT DB_NAME() AS dbname");
    const exists = await pool
      .request()
      .input("email", sql.NVarChar(100), email)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM [User]
        WHERE LTRIM(RTRIM(Email)) = LTRIM(RTRIM(@email)) COLLATE SQL_Latin1_General_CP1_CI_AS
      `);

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

// --- Start server AFTER DB is confirmed ---
const PORT = process.env.PORT || 5000;

async function start() {
  const listen = () =>
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Docs:   http://localhost:${PORT}/api-docs`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log(`Diag:   http://localhost:${PORT}/api/diag/auth-check`);
    });

  if (process.env.SKIP_DB === '1' || process.env.SKIP_DB === 'true') {
    console.warn('⚠️  SKIP_DB is enabled. Starting server without DB connection...');
    return listen();
  }

  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Azure Database");
    await sequelize.sync(); // sync models
    console.log("✅ Database synced");
    listen();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message || error);
    process.exit(1);
  }
}

start();