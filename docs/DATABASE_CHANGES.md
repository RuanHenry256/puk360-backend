# Database Changes (Iteration)

This document records the SQL changes introduced and the rationale.

## Event table
- Added `ImageUrl NVARCHAR(500) NULL` to store poster URLs.
- Clarified defaults and nullability for `Status` and `campus` (with CHECK on allowed campus values in your environment).

Example:
```
IF COL_LENGTH('dbo.Event','ImageUrl') IS NULL
  ALTER TABLE dbo.Event ADD ImageUrl NVARCHAR(500) NULL;

-- Status default and NOT NULL
UPDATE dbo.Event SET Status = 'Scheduled' WHERE Status IS NULL;
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name='DF_Event_Status' AND parent_object_id=OBJECT_ID('dbo.Event'))
  ALTER TABLE dbo.Event ADD CONSTRAINT DF_Event_Status DEFAULT('Scheduled') FOR Status;
ALTER TABLE dbo.Event ALTER COLUMN Status NVARCHAR(50) NOT NULL;
```

## Host_Profile activity model
- Added `Activity_Status NVARCHAR(20) NOT NULL DEFAULT('Inactive')`.
- Added computed `Is_Active` = 1 when `Approval_Status='Approved' AND Activity_Status='Active'`.
- Trigger `TR_Host_Profile_Approval_Sync` keeps `Activity_Status` in sync when `Approval_Status` changes.
- Backfill: set `Activity_Status='Active'` when `Approval_Status='Approved'`, else `Inactive`.

Backfill snippet:
```
UPDATE HP
SET Activity_Status = CASE WHEN Approval_Status = N'Approved' THEN N'Active' ELSE N'Inactive' END
FROM dbo.Host_Profile AS HP
WHERE HP.Activity_Status IN (N'Active', N'Inactive');
```

## Venue handling
- Form collects free‑text `venue` for display.
- Backend resolves `Venue_ID` to a default/“Unspecified” row when not provided to satisfy NOT NULL constraint.

## Current iteration (no schema change)
- Event creation now requires an `ImageUrl` that points to the configured S3 bucket (validated in the controller).
- No additional columns were added; `ImageUrl` continues to store the public poster URL returned after presigned upload.
