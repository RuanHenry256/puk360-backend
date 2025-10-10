# Event Details

Explains how the event detail page works, including RSVP and reviews, across the frontend and backend.

---

## Frontend

- Detail view: `puk360-frontend/src/pages/EventDetails.jsx`
  - Looks up an event by `eventId` from `sampleEvents` and displays details.
  - Actions:
    - Register: currently a TODO; intended to RSVP the user for this event.
    - Write a review: currently a placeholder alert; intended to open a review flow.
- Where it comes from
  - The listing view (`EventListing.jsx`) calls `onSelectEvent(id)`; parent sets `eventId` for details.
- Planned integration
  - Fetch live details: `GET /api/events/:id`.
  - RSVP: `POST /api/events/:id/join` with the current user.
  - Cancel RSVP: `DELETE /api/events/:id/join`.
  - Show attendees: `GET /api/events/:id/attendees`.
  - Reviews: `POST /api/:id/reviews`, `GET /api/:id/reviews` (currently stubbed on backend).

Example RSVP from the client:
```js
import { api } from '../api/client';

async function rsvp(eventId) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  // Current API expects userId in the body. A future hardening step is
  // to enforce auth and derive the userId from the JWT on the server.
  await api.post(`/api/events/${eventId}/join`, { userId: user.id }, token);
}
```

---

## Backend

- Events
  - `GET /api/events/:id` → `puk360-backend/src/routes/eventRoutes.js` → `getEvent` in `eventController.js`.
- RSVP: `puk360-backend/src/routes/rsvpRoutes.js`
  - `POST /api/events/:id/join` → `JoinEvent`
  - `DELETE /api/events/:id/join` → `cancelRSVP`
  - `GET /api/events/:id/attendees` → `getAttendees`
  - Current implementation expects `{ userId }` in the JSON body for join/cancel.
  - Suggestion: add `requireAuth` and derive `userId` from `req.user.id` instead of client-provided body.
- Reviews: `puk360-backend/src/routes/reviewRoutes.js`
  - `POST /api/:id/reviews`, `GET /api/:id/reviews`, `DELETE /api/:id` are present as stubs in `reviewController.js`.

---

## Data Model

- Event: `puk360-backend/src/models/Event.js` (Sequelize)
  - `id`, `title`, `description`, `date`, `location`, `status`
- RSVP join table: `puk360-backend/src/models/EventAttendees.js`
  - Used by RSVP controller to query/insert attendance.

---

## API Examples

Fetch event details
```bash
curl http://localhost:5000/api/events/1
```

Join an event (current contract)
```bash
curl -X POST http://localhost:5000/api/events/1/join \
  -H "Content-Type: application/json" \
  -d '{ "userId": 123 }'
```

Cancel RSVP
```bash
curl -X DELETE http://localhost:5000/api/events/1/join \
  -H "Content-Type: application/json" \
  -d '{ "userId": 123 }'
```

Get attendees
```bash
curl http://localhost:5000/api/events/1/attendees
```

---

## Next Steps

- Add `requireAuth` on RSVP routes and derive the user from JWT claims.
- Implement real review persistence (model + controller) and connect the review UI.
- Replace `sampleEvents` with live data in both listing and details.

