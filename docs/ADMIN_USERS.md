# Admin: Users API

Endpoints for listing users, editing basic info, managing roles, and host reactivation.

Auth: All routes require a Bearer JWT and an Admin role.

Role IDs
- 1 = Student
- 2 = Host
- 3 = Admin

## List users
- GET `/api/admin/users?q=<term>`
- Query `q` filters by name or email (optional)
- Response
```
{ "data": [
  { "User_ID": 12, "Name": "Jane Doe", "Email": "jane@example.com", "Status": "Active", "Roles": ["Student","Host"] }
]}
```

## Get one user (details)
- GET `/api/admin/users/:id`
- Response
```
{ "data": {
  "user": { "User_ID": 12, "Name": "Jane Doe", "Email": "jane@example.com", "Status": "Active" },
  "roles": [{ "Role_ID": 1, "Role_Name": "Student" }, { "Role_ID": 2, "Role_Name": "Host" }],
  "roleIds": [1,2],
  "hostStatus": { "Approval_Status": "Approved", "Activity_Status": "Active", "Is_Active": 1 }
}}
```

## List roles
- GET `/api/admin/roles`
- Response
```
{ "data": [ { "Role_ID": 1, "Role_Name": "Student" }, { "Role_ID": 2, "Role_Name": "Host" }, { "Role_ID": 3, "Role_Name": "Admin" } ] }
```

## Update a user
- PATCH `/api/admin/users/:id`
- Body: `{ name?: string, email?: string, roles?: number[] | ("Student"|"Host"|"Admin")[] }`
- Behavior: Updates name/email; when `roles` is provided, replaces role mappings using the provided IDs/names.
- Response
```
{ "data": { "User_ID": 12, "Name": "Jane Doe", "Email": "jane@example.com", "Roles": ["Student","Admin"] } }
```

Errors
- `400 EMAIL_IN_USE` when another user already owns the requested email.

## Delete a user
- DELETE `/api/admin/users/:id`
- Response: `{ ok: true }`

## Reactivate a host account
- POST `/api/admin/hosts/:id/reactivate`
- Behavior: Upserts/updates `dbo.Host_Profile` for the user to `Approval_Status=Approved`, `Activity_Status=Active`, `Is_Active=1`.
- Response
```
{ "data": { "Approval_Status": "Approved", "Activity_Status": "Active", "Is_Active": 1 } }
```

Notes
- SQL Server compatibility: role aggregation uses `STRING_AGG` when available, with a fallback query for older versions.
