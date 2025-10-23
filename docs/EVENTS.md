# Events

Explains how event listing, creation, and management work in the app.

---

## Frontend

- Listing view: `puk360-frontend/src/pages/EventListing.jsx`
  - Loads from `GET /api/events` via `api.events.list()`.
  - Normalizes fields: `{ id: Event_ID, title: Title, date: YYYY-MM-DD, category, campus, location: venue||campus, image: ImageUrl|null }`.
  - Filters: week (Mon–Sun ranges), Category, Campus, Search; Clear all button.
  - Loading and error states; optional `showTopBar` prop for embedded use (host feed).
- Details view: `puk360-frontend/src/pages/ReviewEventDetail.js`
  - Fetches `GET /api/events/:id` and renders Title, Description, Date/startTime–endTime, Hosted By, Venue/Campus, ImageUrl.
  - “Attendees” metric removed from the UI.

---

## Backend

- Routes: `puk360-backend/src/routes/eventRoutes.js`
  - `GET /api/events` → list events (supports `?hostUserId=<id>` to list only that host’s events)
  - `GET /api/events/:id` → get one event
  - `POST /api/events` → create (requires `Authorization` + active host)
  - `PATCH /api/events/:id` → update (requires `Authorization` + active host)
  - `PATCH /api/events/:id/status` → update status (requires `Authorization` + active host)
  - `DELETE /api/events/:id` → delete (requires `Authorization` + active host)
- Controller: `puk360-backend/src/controllers/eventController.js`
  - CRUD via Sequelize; includes `ImageUrl` and `venue` text fields; auto-resolves `Venue_ID` if omitted.
- Model: `puk360-backend/src/models/Event.js`
  - DB-mapped fields: `Event_ID`, `Title`, `Description`, `Date (DATE)`, `startTime (TIME)`, `endTime (TIME)`, `Host_User_ID`, `Venue_ID`, `Status`, `category`, `hostedBy`, `venue` (text), `campus`, `ImageUrl`.
- Validation: `puk360-backend/src/middleware/validation.js`
  - Accepts either `Title` or `title`, and `Date` or `date` (ISO); requires one of `venue` or `campus`.
- Auth + Host guard:
  - `requireAuth` verifies JWT.
  - `requireActiveHost` (in `src/middleware/hostGuard.js`) enforces `Host_Profile.Is_Active=1` for write actions.

Example: fetch events
```bash
curl http://localhost:5000/api/events
```

Example: create an event (authorized + active host)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "Title": "Open Day",
    "Description": "Campus open day",
    "Date": "2025-10-01",
    "startTime": "10:00",
    "endTime": "12:00",
    "campus": "Potchefstroom",
    "venue": "Main Hall",
    "category": "Community",
    "hostedBy": "NWU Events",
    "ImageUrl": "https://example.com/poster.png"
  }'
```

---

## Notes and Extensions

- Images: `ImageUrl` is persisted (backend sanitizes blanks to NULL); frontend renders a placeholder when invalid/missing.
- Filtering: the feed uses client filters; you can add server-side params to `GET /api/events` as needed.
- Ownership/roles: write routes are restricted to authenticated, active hosts by middleware.
 - Admin management: if admins must manage all events, add a role override in the host guard to permit Admin users on POST/PATCH/DELETE and record appropriate audit info.

---

## Poster Uploads (New)

- Frontend now uploads posters directly to S3 using a backend presign endpoint.
- Endpoint: `POST /api/poster/presign` with body `{ mimeType }` (png, jpg/jpeg, webp, gif).
- Responds with `{ key, uploadUrl, publicUrl }`. The client `PUT`s the raw file to `uploadUrl`.
- Event creation requires an `ImageUrl` that points to the configured S3 bucket domain and is ≤ 500 chars.
- No DB schema changes were needed; we continue to store only `ImageUrl`.

Example presign call:
```bash
curl -X POST http://localhost:5000/api/poster/presign \
  -H "Content-Type: application/json" \
  -d '{
    "mimeType": "image/jpeg"
  }'
```

