/**
 * User repository (SQL Server).
 * Data-access helpers for users: find by email, verify password using SQL
 * HASHBYTES (supports seed/runtime formats), create users, and fetch roles.
 */
import { getSqlPool, sql } from "../db/sql.js";

/** Find a user by email */
export async function findUserByEmail(email) {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("email", sql.NVarChar(100), email)
    .query(`
      SELECT User_ID, Name, Email, Password_Hash, Status
      FROM [User]
      WHERE Email = @email
    `);
  return result.recordset[0] || null;
}

/**
 * Verify user by email + password using SQL HASHBYTES('SHA2_256', @password).
 * Password_Hash column is NVARCHAR(255), so compare in multiple safe ways:
 *  1) NVARCHAR vs HEX string: Password_Hash = CONVERT(NVARCHAR(255), HASHBYTES(...), 2)
 *  2) NVARCHAR -> VARBINARY compare: CONVERT(VARBINARY(32), Password_Hash) = HASHBYTES(...)
 *  3) Direct compare (if it’s stored as varbinary-like string): Password_Hash = HASHBYTES(...)
 */
export async function verifyUserByEmailPassword(email, plainPassword) {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("email", sql.NVarChar(100), email)      // email can stay NVARCHAR
    .input("pw", sql.NVarChar(400), plainPassword) // pass NVARCHAR safely
    .query(`
      SELECT TOP 1 u.User_ID, u.Name, u.Email, u.Status
      FROM [User] u
      WHERE LTRIM(RTRIM(u.Email)) = LTRIM(RTRIM(@email)) COLLATE SQL_Latin1_General_CP1_CI_AS
        AND (
          -- Match users hashed with NVARCHAR input (newly registered)
          u.Password_Hash = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw))
          OR
          -- Match users seeded with VARCHAR input (seed script used VARCHAR literals via CONCAT)
          u.Password_Hash = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', CAST(@pw AS VARCHAR(400))))
        )
    `);
  return result.recordset[0] || null;
}

/** Insert a new user hashing the password IN SQL (same approach as seed script) */
export async function createUserWithSqlHash({ name, email, plainPassword, status = "Active", defaultRoleId = 1 }) {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("name", sql.NVarChar(100), name)
    .input("email", sql.NVarChar(100), email)
    .input("pw", sql.NVarChar(400), plainPassword)
    .input("status", sql.NVarChar(50), status)
    .input("roleId", sql.Int, defaultRoleId)
    .query(`
      DECLARE @newUserId INT;

      INSERT INTO [User] (Name, Email, Password_Hash, Status)
      VALUES (
        @name,
        @email,
        CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw)),
        @status
      );

      SET @newUserId = CAST(SCOPE_IDENTITY() AS INT);

      -- Ensure default role mapping exists for the new user
      IF @newUserId IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM UserRoles WHERE User_ID = @newUserId AND Role_ID = @roleId
      )
      BEGIN
        INSERT INTO UserRoles (User_ID, Role_ID) VALUES (@newUserId, @roleId);
      END

      SELECT @newUserId AS User_ID;
    `);
  return result.recordset[0]?.User_ID;
}

/**
 * Ensure a user has a mapping to a given role in UserRoles.
 * Safe to call repeatedly; it inserts only if not already present.
 */
export async function ensureUserRole(userId, roleId) {
  const pool = await getSqlPool();
  await pool.request()
    .input("userId", sql.Int, userId)
    .input("roleId", sql.Int, roleId)
    .query(`
      IF NOT EXISTS (
        SELECT 1 FROM UserRoles WHERE User_ID = @userId AND Role_ID = @roleId
      )
      BEGIN
        INSERT INTO UserRoles (User_ID, Role_ID) VALUES (@userId, @roleId);
      END
    `);
}

/** Get a user's roles as an array of role names */
export async function getUserRoles(userId) {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT r.Role_Name
      FROM Roles r
      INNER JOIN UserRoles ur ON ur.Role_ID = r.Role_ID
      WHERE ur.User_ID = @userId
    `);
  return result.recordset.map(r => r.Role_Name);
}
/**
 * Update a user's profile fields.
 * Validates email uniqueness and returns the updated basic user row.
 */
export async function updateUserProfile({ userId, name, email }) {
  const pool = await getSqlPool();

  // Ensure no other user already uses the requested email
  const duplicate = await pool.request()
    .input("email", sql.NVarChar(100), email)
    .input("userId", sql.Int, userId)
    .query(`
      SELECT User_ID
      FROM [User]
      WHERE LTRIM(RTRIM(Email)) = LTRIM(RTRIM(@email)) COLLATE SQL_Latin1_General_CP1_CI_AS
        AND User_ID <> @userId
    `);

  if (duplicate.recordset.length > 0) {
    const error = new Error('Email already in use by another account.');
    error.code = 'EMAIL_IN_USE';
    throw error;
  }

  const result = await pool.request()
    .input("name", sql.NVarChar(100), name)
    .input("email", sql.NVarChar(100), email)
    .input("userId", sql.Int, userId)
    .query(`
      UPDATE [User]
      SET Name = @name,
          Email = @email
      WHERE User_ID = @userId;

      SELECT User_ID, Name, Email
      FROM [User]
      WHERE User_ID = @userId;
    `);

  return result.recordset[0] || null;
}

/**
 * List users with optional name/email search and include roles (comma-separated).
 * Returns an array of: { User_ID, Name, Email, Status, Roles: string[] }
 */
export async function listUsers({ q } = {}) {
  const pool = await getSqlPool();
  const term = (q || "").trim();

  // Use STRING_AGG when available (SQL Server 2017+). Fall back to basic list if needed.
  try {
    const result = await pool
      .request()
      .input("q", sql.NVarChar(200), term.length ? `%${term}%` : null)
      .query(`
        SELECT
          u.User_ID,
          u.Name,
          u.Email,
          u.Status,
          STRING_AGG(r.Role_Name, ',') WITHIN GROUP (ORDER BY r.Role_Name) AS RolesCsv
        FROM [User] u
        LEFT JOIN UserRoles ur ON ur.User_ID = u.User_ID
        LEFT JOIN Roles r ON r.Role_ID = ur.Role_ID
        WHERE (@q IS NULL)
           OR (u.Name LIKE @q OR u.Email LIKE @q)
        GROUP BY u.User_ID, u.Name, u.Email, u.Status
        ORDER BY u.Name ASC;
      `);

    return result.recordset.map((row) => ({
      User_ID: row.User_ID,
      Name: row.Name,
      Email: row.Email,
      Status: row.Status,
      Roles: row.RolesCsv ? String(row.RolesCsv).split(',').map((s) => s.trim()).filter(Boolean) : [],
    }));
  } catch (err) {
    // Fallback without STRING_AGG (older SQL versions) – return basic rows.
    const result = await pool
      .request()
      .input("q", sql.NVarChar(200), term.length ? `%${term}%` : null)
      .query(`
        SELECT u.User_ID, u.Name, u.Email, u.Status
        FROM [User] u
        WHERE (@q IS NULL)
           OR (u.Name LIKE @q OR u.Email LIKE @q)
        ORDER BY u.Name ASC;
      `);
    return result.recordset.map((row) => ({
      User_ID: row.User_ID,
      Name: row.Name,
      Email: row.Email,
      Status: row.Status,
      Roles: [],
    }));
  }
}

/** List all roles */
export async function listRoles() {
  const pool = await getSqlPool();
  const result = await pool.request().query(`
    SELECT Role_ID, Role_Name
    FROM Roles
    ORDER BY Role_Name ASC;
  `);
  return result.recordset;
}

/** Update basic user fields (admin) */
export async function updateUserAdmin({ userId, name, email }) {
  return updateUserProfile({ userId, name, email });
}

/** Replace a user's roles by role IDs (full replacement) */
export async function replaceUserRolesByIds(userId, roleIds = []) {
  const pool = await getSqlPool();
  const tx = new sql.Transaction(await getSqlPool());
  await tx.begin();
  try {
    const r = new sql.Request(tx);
    await r.input('userId', sql.Int, userId).query('DELETE FROM UserRoles WHERE User_ID = @userId');
    for (const rid of roleIds) {
      const req = new sql.Request(tx);
      await req.input('userId', sql.Int, userId).input('roleId', sql.Int, rid).query(
        'INSERT INTO UserRoles (User_ID, Role_ID) VALUES (@userId, @roleId)'
      );
    }
    await tx.commit();
  } catch (e) {
    try { await tx.rollback(); } catch {}
    throw e;
  }
}

/** Resolve role IDs from an array of names or numeric IDs */
export async function resolveRoleIds(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return [];
  const pool = await getSqlPool();
  const ids = [];
  const namesToFind = [];
  for (const r of roles) {
    if (r == null) continue;
    const n = Number(r);
    if (!Number.isNaN(n) && Number.isFinite(n)) ids.push(n);
    else namesToFind.push(String(r));
  }
  if (namesToFind.length) {
    // Build a table variable of names
    const nameList = namesToFind.map((s) => s.replace(/'/g, "''")).join("','");
    const q = `SELECT Role_ID FROM Roles WHERE Role_Name IN ('${nameList}')`;
    const res = await pool.request().query(q);
    for (const row of res.recordset) ids.push(row.Role_ID);
  }
  // Deduplicate
  return [...new Set(ids)].filter((v) => typeof v === 'number' && Number.isFinite(v));
}

/** Delete a user (and their role mappings) */
export async function deleteUser(userId) {
  const pool = await getSqlPool();
  const tx = new sql.Transaction(await getSqlPool());
  await tx.begin();
  try {
    const r1 = new sql.Request(tx);
    await r1.input('userId', sql.Int, userId).query('DELETE FROM UserRoles WHERE User_ID = @userId');
    const r2 = new sql.Request(tx);
    const res = await r2.input('userId', sql.Int, userId).query('DELETE FROM [User] WHERE User_ID = @userId');
    await tx.commit();
    return res.rowsAffected?.[0] > 0;
  } catch (e) {
    try { await tx.rollback(); } catch {}
    throw e;
  }
}

/** Get Host_Profile status for a user */
export async function getHostProfile(userId) {
  const pool = await getSqlPool();
  const res = await pool
    .request()
    .input('uid', sql.Int, userId)
    .query(`SELECT TOP 1 Approval_Status, Activity_Status, Is_Active FROM dbo.Host_Profile WHERE User_ID=@uid`);
  return res.recordset?.[0] || null;
}

/** Get a user with roles (id+name) and hostStatus */
export async function getUserWithRolesAndHostStatus(userId) {
  const pool = await getSqlPool();
  const base = await pool
    .request()
    .input('uid', sql.Int, userId)
    .query(`SELECT TOP 1 User_ID, Name, Email, Status FROM [User] WHERE User_ID=@uid`);
  const rolesRes = await pool
    .request()
    .input('uid', sql.Int, userId)
    .query(`
      SELECT r.Role_ID, r.Role_Name
      FROM Roles r
      INNER JOIN UserRoles ur ON ur.Role_ID = r.Role_ID
      WHERE ur.User_ID = @uid
      ORDER BY r.Role_ID ASC;
    `);
  const hostStatus = await getHostProfile(userId);
  const user = base.recordset?.[0] || null;
  const roles = rolesRes.recordset || [];
  const roleIds = roles.map((r) => r.Role_ID);
  return user ? { user, roles, roleIds, hostStatus } : null;
}

/** Reactivate a host account (set Activity_Status to Active and Approved if needed) */
export async function reactivateHost(userId) {
  const pool = await getSqlPool();
  await pool
    .request()
    .input('uid', sql.Int, userId)
    .query(`
      IF EXISTS (SELECT 1 FROM dbo.Host_Profile WHERE User_ID=@uid)
      BEGIN
        UPDATE dbo.Host_Profile
        SET Activity_Status='Active',
            Approval_Status=CASE WHEN Approval_Status IS NULL OR Approval_Status='Pending' THEN 'Approved' ELSE Approval_Status END,
            Is_Active=CASE WHEN Approval_Status='Approved' AND 'Active'='Active' THEN 1 ELSE 1 END
        WHERE User_ID=@uid;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Host_Profile (User_ID, Approval_Status, Activity_Status, Is_Active)
        VALUES (@uid, 'Approved', 'Active', 1);
      END
    `);
  return getHostProfile(userId);
}
