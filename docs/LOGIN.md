# Login Flow

Explains how authentication works end-to-end: UI, API, and data.

---

## Frontend

- Screen: `puk360-frontend/src/pages/LoginScreen.jsx`
  - Provides login and registration modes.
  - On success, stores `token` and `user` in `localStorage` and calls the optional `onLoginSuccess()` prop.
  - Uses the shared API client in `puk360-frontend/src/api/client.js`.
- API client: `puk360-frontend/src/api/client.js`
  - `api.login(email, password)` → `POST /api/auth/login`
  - `api.register(name, email, password)` → `POST /api/auth/register`
  - Automatically serializes JSON and attaches `Authorization: Bearer <token>` if provided.
- Temporary bypass flags exist in `LoginScreen.jsx` to jump directly to admin/host UIs for design iteration. Remove those bypasses for production.

What gets stored on login/register:
- `localStorage.setItem("token", token)`
- `localStorage.setItem("user", JSON.stringify(user))`

Use the token for protected endpoints by passing it to `api.*` helpers or by reading from `localStorage`:
```js
const token = localStorage.getItem('token');
// example protected call
await api.post('/api/events', { title, date, location }, token);
```

---

## Backend

- Routes: `puk360-backend/src/routes/authRoutes.js`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- Controller: `puk360-backend/src/controllers/authController.js`
  - Validates input, verifies credentials/creates user, fetches roles, signs a JWT (`expiresIn: "1h"`).
- Middleware: `puk360-backend/src/middleware/auth.js`
  - `requireAuth` verifies the `Authorization: Bearer <token>` header and sets `req.user`.
- Protected resources (examples):
  - Creating/updating/deleting events requires `Authorization` (see `puk360-backend/src/routes/eventRoutes.js`).

Response shape from both endpoints:
```json
{
  "token": "<jwt>",
  "user": { "id": 123, "name": "Jane", "email": "jane@example.com", "roles": ["Student"] }
}
```

---

## Data Source and Hashing

- User verification and creation are backed by SQL Server.
- The repo uses SQL-side hashing compatible with seeded users (details in `puk360-backend/docs/authentication.md`).
- For production, consider normalizing password storage (e.g., `VARBINARY(32)` or hex-encoded) and enforcing password policies.

---

## Common Errors

- 400 Invalid credentials: wrong email/password.
- 401 Missing/invalid token: when calling protected endpoints without a valid `Authorization` header.
- 409 Email already registered: duplicate registration.

---

## Suggestions

- Route guarding in the frontend (e.g., check token before showing protected views).
- Token refresh or re-login prompt on 401 responses.
- Remove design-only bypasses before shipping.

