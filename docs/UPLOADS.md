# Poster Uploads

This document explains how poster uploads work using S3 presigned URLs.

## Overview
- Frontend requests a presigned PUT URL from the backend.
- Frontend uploads the raw file directly to S3 using the presigned URL.
- Backend never receives file bytes — only the eventual `ImageUrl` is stored on the `Event` row.

## Environment
Set the following in the backend `.env`:

```
AWS_ACCESS_KEY_ID=<redacted>
AWS_SECRET_ACCESS_KEY=<redacted>
AWS_REGION=ap-south-1
S3_BUCKET=puk360-posters-ap-south-1
```

## Helper
- File: `src/aws/s3Client.js`
  - `s3` — configured `S3Client` (AWS SDK v3)
  - `getPresignedPutUrl(key, mimeType)` — presigns a `PutObjectCommand` (5 minutes expiry)
  - `getPresignedGetUrl(key)` — presigns GET (future use)
  - `bucketPublicUrl(key)` — `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`

## API
- Route file: `src/routes/upload.js`
- Endpoint: `POST /api/poster/presign`
- Body: `{ mimeType: string, extension?: string }`
- Rules:
  - Allowed mimes: `image/png`, `image/jpeg`/`image/jpg`, `image/webp`, `image/gif`
  - Key format: `posters/<uuid>.<ext>` (extension derived from mime when omitted)
- Response:

```
{
  "key": "posters/8c9c...c0b.jpg",
  "uploadUrl": "https://s3...",
  "publicUrl": "https://puk360-posters-ap-south-1.s3.ap-south-1.amazonaws.com/posters/8c9c...c0b.jpg"
}
```

Example:
```
curl -X POST http://localhost:5000/api/poster/presign \
  -H "Content-Type: application/json" \
  -d '{"mimeType":"image/jpeg"}'
```

## Event Create Contract
- Creating an event now requires an image URL.
- The backend validates that:
  - `ImageUrl` is present and ≤ 500 chars
  - It starts with your bucket domain: `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`
- No DB schema change was required (uses existing `ImageUrl NVARCHAR(500)` column).

## Frontend Flow (summary)
1) User selects/drops an image (≤ 8MB) of type PNG/JPG/JPEG/WEBP/GIF
2) Frontend calls `POST /api/poster/presign` with `{ mimeType }`
3) Uploads with `PUT uploadUrl` and `Content-Type: mimeType`; shows progress
4) On success, stores `publicUrl` and includes it as `ImageUrl` in `POST /api/events`
