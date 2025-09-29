# Authentication Overview

This document describes the authentication features added to the backend: user registration, login, password hashing, and diagnostics.

---

## Endpoints

- Register: `POST /api/auth/register`
  - Body: `{ "name": string, "email": string, "password": string }`
  - Response: `{ token, user: { id, name, email, roles } }`

- Login: `POST /api/auth/login`
  - Body: `{ "email": string, "password": string }`
  - Response: `{ token, user: { id, name, email, roles } }`

Both endpoints return a signed JWT in `token`, which the frontend can store and attach as `Authorization: Bearer <token>`.

---

## Implementation

- Controller: `puk360-backend/src/controllers/authController.js:14`
  - Registers users by delegating to the repository to hash-and-insert, then issues a JWT.
  - Logs in users by verifying email+password, fetching roles, and issuing a JWT.

- Repository: `puk360-backend/src/data/userRepo.js:24`
  - `verifyUserByEmailPassword(email, pw)` performs SQL-side hashing and compares against the stored `Password_Hash`.
  - To support existing seeded users and new registrations, verification checks two forms of hashing input:
    - `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw))`
    - `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', CAST(@pw AS VARCHAR(400))))`
  - `createUserWithSqlHash(...)` hashes the password in SQL with `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw))` and inserts the user.
  - `getUserRoles(userId)` returns an array of role names by joining `UserRoles` and `Roles`.

- Routes: `puk360-backend/src/routes/authRoutes.js:1`
  - Exposes `POST /api/auth/register` and `POST /api/auth/login`.

---

## Password Hashing and Seed Compatibility

The database schema has `Password_Hash NVARCHAR(255)`. Your seed populated users like:

```sql
INSERT INTO [User] (Name, Email, Password_Hash, Status)
VALUES (..., HASHBYTES('SHA2_256', CONCAT('Password', @i)), ...);
```

That means raw bytes from `HASHBYTES` were implicitly stored in `NVARCHAR(255)`. At runtime we now compare using SQL so that both seeded and newly registered users authenticate correctly:

- Newly registered users: `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw))`
- Seeded users: `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', CAST(@pw AS VARCHAR(400))))`

This dual-compare fixes the mismatch between hashing VARBINARY derived from `NVARCHAR` vs `VARCHAR` inputs.

Recommendation for future hardening:

- Normalize storage to one canonical format:
  - Store raw bytes in `VARBINARY(32)` and compare to `HASHBYTES(...)`, or
  - Store hex via `CONVERT(VARCHAR(64), HASHBYTES(...), 2)` and compare to the same.
- Add a migration to convert existing `Password_Hash` values, then simplify verification to a single comparison.

---

## Diagnostics

A temporary diagnostic route helps validate DB connectivity and hashing behavior:

- `GET /api/diag/auth-check?email=user24@example.com&pw=Password24`
- Location: `puk360-backend/src/server.js:57`
- Response includes the DB name, whether the email exists, and whether the password matches using the NVARCHAR comparison.

Remove this route once verification is complete.

---

## Environment Variables

Configure database and auth secrets either via a single `AZURE_SQL_CONNECTION_STRING` or discrete vars. See `puk360-backend/env.example`.

- Required
  - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT` (optional) or `AZURE_SQL_CONNECTION_STRING`
  - `JWT_SECRET` (for signing tokens)

- Optional
  - `CORS_ORIGIN` (defaults to `http://localhost:3000`)

