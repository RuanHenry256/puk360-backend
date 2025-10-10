# Authentication Overview

This doc focuses on backend authentication: endpoints, JWT issuance and middleware, password hashing/seed compatibility, and diagnostics.

For a front-to-back walkthrough (UI + API), see `puk360-backend/docs/LOGIN.md`.

---

## Endpoints

- Register: `POST /api/auth/register`
  - Body: `{ "name": string, "email": string, "password": string }`
  - Response: `{ token, user: { id, name, email, roles } }`
  - Side effect: Newly registered users are automatically granted the default
    Student role by inserting a row into `UserRoles (User_ID, Role_ID)` with
    `Role_ID = 1` in the same SQL batch as user creation.

- Login: `POST /api/auth/login`
  - Body: `{ "email": string, "password": string }`
  - Response: `{ token, user: { id, name, email, roles } }`

Both endpoints return a signed JWT in `token`. Clients should send `Authorization: Bearer <token>` to access protected routes.

---

## Implementation

- Controller: `puk360-backend/src/controllers/authController.js`
  - Validates inputs, creates or verifies users via repo, fetches roles, signs a JWT (`expiresIn: "1h"`).

- Repository: `puk360-backend/src/data/userRepo.js`
  - `verifyUserByEmailPassword(email, pw)` uses SQL-side hashing compatible with both seeded and newly registered users:
    - `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw))`
    - `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', CAST(@pw AS VARCHAR(400))))`
  - `createUserWithSqlHash(...)` inserts using `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw))`.
    - During this insert, the repo also ensures a default role mapping exists
      for the new user: `INSERT INTO UserRoles (User_ID, Role_ID) VALUES (@newUserId, 1)`
      guarded with `IF NOT EXISTS`.
  - `getUserRoles(userId)` returns an array of role names.
  - `updateUserProfile({ userId, name, email })` ensures email uniqueness and updates basic profile fields.

- Routes: `puk360-backend/src/routes/authRoutes.js`
  - Exposes `POST /api/auth/register` and `POST /api/auth/login`.

---

## JWT and Middleware

- Middleware: `puk360-backend/src/middleware/auth.js`
  - `requireAuth` expects `Authorization: Bearer <jwt>` and attaches the decoded claims to `req.user`.
- Protected endpoints
  - Events create/update/delete/status use `requireAuth` (see `src/routes/eventRoutes.js`).
  - RSVP routes currently do not enforce auth; consider adding `requireAuth` and deriving `userId` from `req.user.id` instead of trusting body input.

---

## Roles

Tables involved:
- `Roles (Role_ID, Role_Name)`
- `UserRoles (User_ID, Role_ID)`

Conventions in this project:
- Role IDs: `1 = Student`, `2 = Host`, `3 = Admin`.
- API returns `user.roles` as names, e.g. `["Student"]`, `["Host"]`, `["Admin"]`.

On registration:
- Default role Student is attached automatically (see above). Admin/Host
  elevation is done by inserting additional rows in `UserRoles`.

On login:
- The JWT embeds the array of role names so the frontend can gate views.

Example decoded payload:
```json
{
  "id": 108,
  "email": "user@example.com",
  "roles": ["Student"],
  "iat": 1700000000,
  "exp": 1700003600
}
```

---

## Password Hashing and Seed Compatibility

The `Password_Hash` column is `NVARCHAR(255)`. Seeded users were inserted with `HASHBYTES('SHA2_256', CONCAT('Password', @i))`, which led to NVARCHAR storage of raw hash bytes. To handle both historical and new users, verification compares against two forms:

- Newly registered: `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @pw))`
- Seed-compatible: `CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', CAST(@pw AS VARCHAR(400))))`

Hardening recommendations:

- Normalize to a canonical format (e.g., store raw bytes in `VARBINARY(32)` or hex via `CONVERT(VARCHAR(64), HASHBYTES(...), 2)`).
- Migrate existing values to the chosen format, then simplify verification to a single comparison.

---

## Diagnostics (Temporary)

Diagnostic route to confirm DB connectivity and hashing behavior:

- `GET /api/diag/auth-check?email=user24@example.com&pw=Password24`
- Location: `puk360-backend/src/server.js`
- Response shows DB name, whether the email exists, and whether the password matches.

Remove this endpoint in production.

---

## Environment Variables

Configure database and auth secrets in `.env` (see `puk360-backend/env.example`).

- Required
  - `AZURE_SQL_CONNECTION_STRING` or (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`)
  - `JWT_SECRET`

- Optional
  - `CORS_ORIGIN` (default `http://localhost:3000`)
  - `SKIP_DB` set to `1` to start the server without DB (dev only)

---

## Related Docs

- Frontend login flow: `puk360-backend/docs/LOGIN.md`
- API reference (live): `http://localhost:5000/api-docs` (Swagger UI)
- Swagger setup: `puk360-backend/docs/API_SWAGGER.md`

