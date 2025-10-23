import { Router } from 'express';
import { randomUUID } from 'crypto';
import mime from 'mime-types';
import { getPresignedPutUrl, bucketPublicUrl } from '../aws/s3Client.js';

const router = Router();

function validateImageMime(m) {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
  return typeof m === 'string' && allowed.includes(m);
}

router.post('/poster/presign', async (req, res) => {
  try {
    const { mimeType, extension } = req.body || {};
    if (!validateImageMime(mimeType)) {
      return res.status(400).json({ error: 'Invalid mime type' });
    }
    const ext = (typeof extension === 'string' && extension.trim().length)
      ? extension.trim().replace(/^\./, '')
      : (mime.extension(mimeType) || (mimeType.endsWith('jpeg') ? 'jpg' : null));
    if (!ext) return res.status(400).json({ error: 'Unsupported image type' });

    const key = `posters/${randomUUID()}.${ext}`;
    const uploadUrl = await getPresignedPutUrl(key, mimeType, 300);
    const publicUrl = bucketPublicUrl(key);
    return res.json({ key, uploadUrl, publicUrl });
  } catch (e) {
    console.error('presign error:', e);
    return res.status(500).json({ error: 'Failed to presign' });
  }
});

export default router;

