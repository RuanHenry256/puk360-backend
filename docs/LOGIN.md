# Login Flow

Explains how authentication works end-to-end: UI, API, roles, and data.

---

## Frontend

- Screen: `puk360-frontend/src/pages/LoginScreen.jsx`
  - Provides login and registration modes.
  - On success, stores `token` and `user` in `localStorage` and calls the optional `onLoginSuccess()` prop.
  - Uses the shared API client in `puk360-frontend/src/api/client.js`.
- App routing: `puk360-frontend/src/App.js`
  - After login, reads `user.roles` and routes:
    - Admin → Admin dashboard (`AdminMainDash`)
    - Host → Host dashboard (`HostMain`)
    - Otherwise → Events feed (student)
  - The check is tolerant to role names or numeric IDs (1/2/3). The API returns names by default.
  - The login response also provides `user.hostStatus` with host account status; the UI uses it to disable host-only actions if inactive.
- API client: `puk360-frontend/src/api/client.js`
  - `api.login(email, password)` → `POST /api/auth/login`
  - `api.register(name, email, password)` → `POST /api/auth/register`
  - Automatically serializes JSON and attaches `Authorization: Bearer <token>` if provided.

What gets stored on login/register:
- `localStorage.setItem("token", token)`
- `localStorage.setItem("user", JSON.stringify(user))`

Use the token for protected endpoints by passing it to `api.*` helpers or by reading from `localStorage`:
```js
const token = localStorage.getItem('token');
await api.post('/api/events', { title, date, location }, token);
```

---

## Backend

- Routes: `puk360-backend/src/routes/authRoutes.js`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- Controller: `puk360-backend/src/controllers/authController.js`
  - Validates input, verifies credentials/creates user, fetches roles, signs a JWT (`expiresIn: "1h"`).
  - Includes `hostStatus` from `Host_Profile` in the login response `{ user: { ..., hostStatus } }`.
- Middleware: `puk360-backend/src/middleware/auth.js`
  - `requireAuth` verifies the `Authorization: Bearer <token>` header and sets `req.user`.
- Protected resources (examples):
  - Creating/updating/deleting events requires `Authorization` (see `puk360-backend/src/routes/eventRoutes.js`).

Response shape from both endpoints:
```json
{
  "token": "<jwt>",
  "user": {
    "id": 123,
    "name": "Jane",
    "email": "jane@example.com",
    "roles": ["Student"],
    "hostStatus": { "Approval_Status": "Approved", "Activity_Status": "Active", "Is_Active": 1 }
  }
}
```

---

## Roles

- Tables: `Roles` and `UserRoles`.
- Role IDs: `1 = Student`, `2 = Host`, `3 = Admin`.
- API returns `user.roles` as names (e.g., `["Student"]`).
- On registration, the repo inserts a `UserRoles` row with `Role_ID = 1` (Student) in the same SQL batch as the new user.
- To promote a user to Host manually, add another `UserRoles` row with `Role_ID = 2`. In production, the Admin Host Applications flow handles this and activates `Host_Profile`.

---

## Data Source and Hashing

- SQL Server backs verification and creation.
- Hashing uses SQL `HASHBYTES('SHA2_256', ...)` and supports seeded/user-insert formats (see `AUTHENTICATION.md`).

---

## Common Errors

- 400 Invalid credentials: wrong email/password.
- 401 Missing/invalid token: when calling protected endpoints without a valid `Authorization` header.
- 409 Email already registered: duplicate registration.

---

## Suggestions

- Route guarding in the frontend — the app already switches workspace at login based on roles.
- Token refresh or re-login prompt on 401 responses.
- Admin/Host elevation: recommended via the Host Applications review flow (`/api/admin/host-applications`).

