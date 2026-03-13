import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const UPLOAD_DIR = path.resolve('uploads');

/**
 * Persists an uploaded file buffer and returns its public URL.
 * Uses Cloudinary when configured, otherwise writes to local /uploads.
 */
export async function saveImage(file, req) {
  if (!file) return '';

  if (hasCloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'storepilot' },
        (err, result) => (err ? reject(err) : resolve(result.secure_url))
      );
      stream.end(file.buffer);
    });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.originalname) || '.png';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
}

export const usingCloudinary = Boolean(hasCloudinary);
