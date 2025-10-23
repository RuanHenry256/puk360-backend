import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET = process.env.S3_BUCKET;

export const s3 = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

export async function getPresignedPutUrl(key, mimeType, expiresInSeconds = 300) {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mimeType });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function getPresignedGetUrl(key, expiresInSeconds = 300) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export function bucketPublicUrl(key) {
  const region = REGION;
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

