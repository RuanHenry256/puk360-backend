# Events

Explains how event listing, creation, and management work in the app.

---

## Frontend

- Listing view: `puk360-frontend/src/pages/EventListing.jsx`
  - Currently uses `sampleEvents` and client-side filters (date/category/location + search).
  - Clicking a card calls `onSelectEvent(event.id)` so the parent can show details for that ID.
- Planned integration
  - Replace `sampleEvents` with a real fetch: `GET /api/events`.
  - Map response fields to card UI: `title`, `date`, `location`, `category` (if/when present), and an image URL.
  - Keep filters client-side to start; server-side filters can be added later with query params.
- API client suggestion
  - Add a helper like `api.get('/api/events')` and call it in `useEffect` to populate the list.

---

## Backend

- Routes: `puk360-backend/src/routes/eventRoutes.js`
  - `GET /api/events` → list all events
  - `GET /api/events/:id` → get one event
  - `POST /api/events` → create (requires `Authorization`)
  - `PATCH /api/events/:id` → update (requires `Authorization`)
  - `PATCH /api/events/:id/status` → update status (requires `Authorization`)
  - `DELETE /api/events/:id` → delete (requires `Authorization`)
- Controller: `puk360-backend/src/controllers/eventController.js`
  - Orchestrates CRUD using the Sequelize model.
- Model: `puk360-backend/src/models/Event.js`
  - Fields: `id`, `title`, `description`, `date`, `location`, `status` (enum: `active|cancelled|completed`), timestamps.
- Validation: `puk360-backend/src/middleware/validation.js`
  - Ensures basic fields and status shape.
- Auth: `puk360-backend/src/middleware/auth.js`
  - `requireAuth` protects create/update/delete endpoints.

Example: fetch events
```bash
curl http://localhost:5000/api/events
```

Example: create an event (authorized)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Open Day",
    "description": "Campus open day",
    "date": "2025-10-01T10:00:00.000Z",
    "location": "Potchefstroom",
    "status": "active"
  }'
```

---

## Notes and Extensions

- Images & categories: The current model does not include `image` or `category`. Frontend sample data shows both, so add columns if you plan to persist them.
- Filtering: For large datasets, add query params (e.g., `?date=...&category=...&location=...&q=...`) and implement them in the controller layer.
- Ownership/roles: If some actions should be restricted (e.g., only hosts/admins create), add a role check after `requireAuth` using `req.user.roles`.

