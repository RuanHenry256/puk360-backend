# 🧾 PUK360 Database Update Summary — 13 Oct 2025

## Overview
Today’s work involved cleaning up and reseeding the **PUK360 Azure SQL Database** (`puk360-db`) to replace placeholder test data (e.g. `User1`, `User2`, etc.) with realistic data modeled on NWU student email patterns and role assignments.

---

## 🧹 1. Database Cleanup
**Goal:** Remove all existing test data while preserving table structure and constraints.

### Actions:
- Disabled foreign key constraints temporarily to allow safe deletion.
- Truncated dependent tables in the correct order to avoid FK violations.
- Re-enabled all constraints after cleanup.

### Tables Cleared:
```
Event_Attendees
Review
Host_Applications
Event
Admin_Profile
Host_Profile
Student_Profile
UserRoles
[User]
```

---

## 👤 2. User Table Reseeding
**Goal:** Generate 124 realistic users using NWU-style email addresses.

### Details:
- **Email format:** `<studentNumber>@mynwu.ac.za`
- **Student number range:** 30,000,000 – 50,000,000 (randomly generated)
- **Password hashing method:** `HASHBYTES('SHA2_256', CONCAT('Password', studentNumber))`
  - Example plaintext: `Password30257912`
- **Status:** Random mix of `Active` and `Inactive`
- **Date Created:** Randomized over recent months
- **Names:** Random South African first + last names used for realism

---

## 🧠 3. Roles and Access Setup
**Goal:** Assign roles in a realistic ratio with one Admin, one Host, and the rest Students.

### Roles in `Roles` table:
| Role_ID | Role_Name |
|----------|------------|
| 1 | Student |
| 2 | Host |
| 3 | Admin |

### Role Distribution:
- **1 Admin** — randomly selected user
- **1 Host** — randomly selected user
- **122 Students** — remaining users

### Table: `UserRoles`
- Each user now has at least one active role.
- Includes seeding metadata:
  - `Status` = `Active`
  - `Status_Updated_At` = current timestamp
  - `Status_Reason` = `'Seeded automatically during data refresh'`

---

## 🏛️ 4. Profile Tables
**Goal:** Populate associated profile tables for each role type.

### Student Profiles
- Created one per student.
- Random boolean for `Residence_flag`.

### Host Profile
- Created for the single host.
- `Approval_Status` set to `'Approved'`.
- `Society_Faculty` randomly assigned (e.g. `'Faculty of Engineering'`, `'Faculty of Education'`).

### Admin Profile
- Created for the single admin.
- `Permission_Level` set to `'Full'`.

---

## 🎭 5. Events and Venues
**Goal:** Populate realistic events and venues for testing.

### Venues:
| Name | Capacity | Location |
|------|-----------|-----------|
| Main Hall | 200 | Building A |
| Conference Room | 50 | Building B |
| Outdoor Stage | 300 | Campus Park |
| Lecture Theatre | 100 | Building C |
| Auditorium | 150 | Building D |

### Events:
- 5 events created, hosted by the single Host user.
- Example:
  - *Welcome Party* — `2025-09-20`, `18:00`, Venue 1
  - *Coding Workshop* — `2025-09-22`, `14:00`, Venue 2

### Attendees:
- 10 random student attendees per event in `Event_Attendees`.

---

## 🧩 6. Review & Host Applications
**Reviews:**
- 20 reviews added, each linked to a valid event and host.

**Host Applications:**
- 10 random applications with mixed `Pending` and `Approved` statuses.

---

## 🔑 7. Testing Credentials
**You can test login using the following accounts:**

| Role | Email | Password |
|------|--------|-----------|
| Admin | `<adminStudentNum>@mynwu.ac.za` | `Password<adminStudentNum>` |
| Host | `<hostStudentNum>@mynwu.ac.za` | `Password<hostStudentNum>` |

*(Use the query provided in the previous step to retrieve their exact details.)*

---

## ✅ 8. Validation Queries
After reseeding, the following queries were used to verify data integrity:

```sql
-- All users have at least one role
SELECT COUNT(*) FROM dbo.[User];
SELECT COUNT(DISTINCT User_ID) FROM dbo.[UserRoles];

-- Orphan check
SELECT U.User_ID, U.Name FROM dbo.[User] U
LEFT JOIN dbo.[UserRoles] R ON R.User_ID = U.User_ID
WHERE R.User_ID IS NULL;

-- Role distribution summary
SELECT R.Role_Name, COUNT(*) AS Count
FROM dbo.[UserRoles] UR
JOIN dbo.[Roles] R ON UR.Role_ID = R.Role_ID
GROUP BY R.Role_Name;
```

---

## 🧱 9. Next Steps
- Optionally add a **trigger** to auto-assign `Student` to any new user inserts.
- Periodically re-run the validation queries above.
- Backup this seed state as a clean restore point for future UAT resets.

---

**Prepared by:** Ruan Henry  
**Date:** 13 Oct 2025  
**Environment:** Azure SQL Database — `puk360-db`

