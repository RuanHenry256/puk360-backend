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
