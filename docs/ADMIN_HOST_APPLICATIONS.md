# Admin: Host Applications

Endpoints and data flow for reviewing host applications.

## Endpoints
- `GET /api/admin/host-applications?status=Pending|Approved|Rejected|All`
  - Returns `{ data: Application[] }` with Applicant name/email, Org_Name, Event_Type, Motivation, Status, Review_Comment.
- `PATCH /api/admin/host-applications/:id`
  - Body: `{ decision: 'APPROVED' | 'REJECTED', comment?: string }`
  - On APPROVED:
    - Ensures `UserRoles` has the Host role mapping for the applicant
    - Upserts `Host_Profile` to `Approval_Status='Approved', Activity_Status='Active'`

## Tables used
- `Host_Applications` (Application_ID, Applicant_User_ID, Org_Name, Event_Type, Motivation, Status, Review_Comment, Reviewers_User_ID, Application_Date)
- `UserRoles` + `Roles` (to assign Host role)
- `Host_Profile` (to reflect active host account)

## Frontend flow (Admin dashboard)
- Host Applications page lists cards in a two‑column grid (desktop) / one column (mobile).
- Clicking a card opens a detail modal with full info, a reviewer comment field, and Approve/Reject actions.
- After action, the application is removed from the current list.

