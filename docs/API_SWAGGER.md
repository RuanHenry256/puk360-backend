# Swagger API Docs

This guide explains how to view, use, and extend the Swagger/OpenAPI documentation for the PUK360 backend.

---

## Where To Find It

- UI: `http://localhost:5000/api-docs`
- Spec generator: `puk360-backend/src/config/swagger.js`
  - OpenAPI 3.0 configured with JWT bearer security.
  - Scans route files via: `apis: ["src/routes/*.js"]`
- Mounted in server: `puk360-backend/src/server.js` under `/api-docs`.

---

## Start and View

1) Start the backend: `npm start` from `puk360-backend/`.
2) Open the UI: `http://localhost:5000/api-docs`.
3) Optional: Click the "Authorize" button and paste a JWT as `Bearer <token>` to try protected endpoints.

Tip: Use `POST /api/auth/login` from the UI to obtain a token, then click Authorize.

---

## Covered Endpoints (by route file)

- Auth: `puk360-backend/src/routes/authRoutes.js`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- Events: `puk360-backend/src/routes/eventRoutes.js`
  - `GET /api/events`, `GET /api/events/{id}`
  - `POST /api/events` (auth)
  - `PATCH /api/events/{id}` (auth)
  - `PATCH /api/events/{id}/status` (auth)
  - `DELETE /api/events/{id}` (auth)
- RSVP: `puk360-backend/src/routes/rsvpRoutes.js`
  - `POST /api/events/{id}/join`
  - `DELETE /api/events/{id}/join`
  - `GET /api/events/{id}/attendees`
- Uploads: `puk360-backend/src/routes/upload.js`
  - `POST /api/poster/presign`
- Reviews (stubs): `puk360-backend/src/routes/reviewRoutes.js`
  - `POST /api/{id}/reviews`
  - `GET /api/{id}/reviews`
  - `DELETE /api/{id}`
- Admin: `puk360-backend/src/routes/adminRoutes.js`
  - `GET /api/admin/dashboard` (analytics)
  - `GET /api/admin/users` `GET /api/admin/users/{id}` `PATCH /api/admin/users/{id}` (name/email/roles and optional password)
  - `GET /api/admin/roles`
  - `GET /api/admin/host-applications` `PATCH /api/admin/host-applications/{id}`
  - `POST /api/admin/hosts/{id}/reactivate`
  - `GET /api/admin/logs` (audit feed; supports `limit` and `q`)

Note: The UI is driven by JSDoc comments inside these files. Adjust comments to update the docs.

---

## Authentication in Swagger

- Global bearer auth is declared in the spec (`BearerAuth`).
- To call protected endpoints:
  1. Get a token via `POST /api/auth/login`.
  2. Click "Authorize" in Swagger UI.
  3. Enter: `Bearer <your-jwt>` and click Authorize.

Middleware reference: `puk360-backend/src/middleware/auth.js` (`requireAuth`).

---

## Securing RSVP Routes

RSVP endpoints currently accept `userId` in the request body, but they are candidates for protection with `requireAuth` and deriving the user from the JWT.

- Before calling RSVP endpoints in Swagger UI, click "Authorize" and provide `Bearer <token>`.
- If/when `requireAuth` is enforced on RSVP routes, clients should omit `userId` from the body and the server will use `req.user.id`.

Example (authorized curl):
```bash
curl -X POST http://localhost:5000/api/events/1/join \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "userId": 123 }' # may be removed once server derives from JWT
```

---

## Adding or Updating Docs

Swagger is generated from JSDoc-style comments in route files. General pattern:

```js
/**
 * @swagger
 * /api/widgets:
 *   get:
 *     summary: List widgets
 *     tags: [Widgets]
 *     responses:
 *       200:
 *         description: Array of widgets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Widget'
 */
router.get('/widgets', listWidgets);
```

Define reusable schemas and security in the route files or rely on what’s in `swagger.js`. Example schema block:

```js
/**
 * @swagger
 * components:
 *   schemas:
 *     Widget:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 */
```

Make sure your new/updated route file lives under `puk360-backend/src/routes/` so it is picked up by the `apis` glob.

---

## Troubleshooting

- UI not found: Ensure backend is running and `app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));` exists in `src/server.js`.
- New routes missing: Are they in `src/routes/` and annotated with `@swagger`? Restart server to rebuild specs.
- Auth errors in UI: Click Authorize and provide a valid `Bearer <token>`; confirm `JWT_SECRET` is set in the environment.
- CORS when calling from the browser: adjust `CORS_ORIGIN` in environment if needed.

---

## Related Files

- `puk360-backend/src/config/swagger.js`
- `puk360-backend/src/server.js`
- `puk360-backend/src/routes/*.js`
- `puk360-backend/docs/authentication.md` (deeper backend auth details)
