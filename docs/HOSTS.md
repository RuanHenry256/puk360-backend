# Hosts: Status, Guard, and Analytics

This document explains the host account model, the status check guarding write actions, and host analytics endpoints.

## Host account model
- Source of truth: `dbo.Host_Profile`
  - `Approval_Status` (e.g., Pending, Approved)
  - `Activity_Status` (Active, Inactive, Suspended, Disabled)
  - `Is_Active` (computed): 1 if `Approval_Status='Approved' AND Activity_Status='Active'`, else 0
- Trigger `TR_Host_Profile_Approval_Sync` keeps `Activity_Status` aligned with `Approval_Status` for Active/Inactive values.

## Guarding write actions
- Middleware: `src/middleware/hostGuard.js` → `requireActiveHost`
  - Fetches `Is_Active` from `Host_Profile` for `req.user.id`
  - If not active, returns 403 ({ error, details })
- Applied to event write routes (`src/routes/eventRoutes.js`):
  - POST `/api/events` (create)
  - PATCH `/api/events/:id` (update)
  - PATCH `/api/events/:id/status` (status update)
  - DELETE `/api/events/:id` (delete)

## Login/Profile payload
- Login (`/api/auth/login`) and profile update (`PATCH /api/users/me`) include `user.hostStatus` with `Approval_Status`, `Activity_Status`, `Is_Active`.

## Host analytics endpoints
- `GET /api/hosts/:hostUserId/stats`
  - Returns: `{ avgRating, totalUpcoming, avgRsvpPerEvent }`
- `GET /api/hosts/:hostUserId/top-events?metric=rsvps|reviews&limit=2`
- `GET /api/hosts/:hostUserId/category-mix`
- `GET /api/hosts/:hostUserId/rsvp-trend?days=30`

All analytics use SQL aggregates against `Event`, `Review`, `Event_Attendees` filtered by `Host_User_ID`.

## Event creation model adjustments
- `Event.ImageUrl` column added; backend sanitizes empty/whitespace to NULL.
- Venue handling: hosts submit free‑text `venue` for display; `Venue_ID` is resolved to a default/unified “Unspecified” row when not provided.

