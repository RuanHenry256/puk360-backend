// src/db/sql.js
/**
 * MSSQL pool helper using `mssql`.
 * Builds a singleton connection from AZURE_SQL_CONNECTION_STRING or
 * discrete DB_* env vars, with Azure encryption defaults.
 */
import sql from "mssql";

let pool;

/**
 * Return a singleton SQL connection pool.
 * Supports:
 *  - AZURE_SQL_CONNECTION_STRING
 *  - or discrete DB_* env vars (DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT)
 *  - or legacy SQL_* env vars
 */
export async function getSqlPool() {
  if (pool) return pool;

  // 1) Single connection string takes precedence (optional)
  const connStr = process.env.AZURE_SQL_CONNECTION_STRING?.trim();
  if (connStr) {
    pool = await sql.connect(connStr);
    return pool;
  }

  // 2) Discrete env vars (your current .env)
  const host =
    process.env.DB_HOST ||
    process.env.SQL_SERVER;
  const database =
    process.env.DB_NAME ||
    process.env.SQL_DATABASE;
  let user =
    process.env.DB_USER ||
    process.env.SQL_USER;
  const password =
    process.env.DB_PASS ||
    process.env.SQL_PASSWORD;
  const port = Number(process.env.DB_PORT || 1433);

  if (!host || !database || !user || !password) {
    throw new Error(
      `Missing DB config. Got host=${host}, database=${database}, user=${user ? "(provided)" : ""}, password=${password ? "(provided)" : ""}`
    );
  }

  // Azure SQL login is typically just 'Admin001' (without '@server') for Tedious.
  if (/@/.test(user)) user = user.split("@")[0];

  const config = {
    server: host,              // e.g. "puk360-server.database.windows.net"
    database,                  // e.g. "puk360-db"
    user,                      // e.g. "Admin001"
    password,                  // your password
    port,                      // default 1433
    options: {
      encrypt: true,           // Azure SQL requires encryption
      trustServerCertificate: false
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  };

  pool = await sql.connect(config);
  return pool;
}

export { sql };
