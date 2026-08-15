import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with validation for production
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const hasValidCloudinary = cloudName && apiKey && apiSecret && 
  cloudName !== 'demo' && apiKey !== 'demo' && apiSecret !== 'demo';

if (process.env.NODE_ENV === 'production') {
  if (!hasValidCloudinary) {
    console.warn('[GikpsMail] WARNING: Cloudinary credentials missing or invalid in production!');
    console.warn('  File uploads will fall back to local storage (not persistent on Render).');
    console.warn('  CLOUDINARY_CLOUD_NAME:', cloudName || 'MISSING');
    console.warn('  CLOUDINARY_API_KEY:', apiKey ? 'SET' : 'MISSING');
    console.warn('  CLOUDINARY_API_SECRET:', apiSecret ? 'SET' : 'MISSING');
  } else {
    console.log('[GikpsMail] Cloudinary configured successfully for production uploads.');
  }
}

cloudinary.config({
  cloud_name: hasValidCloudinary ? cloudName : 'demo',
  api_key: hasValidCloudinary ? apiKey : 'demo',
  api_secret: hasValidCloudinary ? apiSecret : 'demo',
});

// Determine the correct base URL for serving uploaded files
const RENDER_APP_URL = process.env.RENDER_APP_URL || process.env.APP_URL;
const APP_URL = RENDER_APP_URL || 'http://localhost:3001';

if (process.env.NODE_ENV === 'production' && !RENDER_APP_URL) {
  console.warn('[GikpsMail] WARNING: RENDER_APP_URL not set. Attachment URLs may be incorrect on Render.');
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure local upload directory exists (works on Render for the lifetime of the container)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Determine if we should use Cloudinary or local storage.
 * Uses Cloudinary only when credentials are valid; otherwise falls back to local.
 */
const USE_CLOUDINARY = hasValidCloudinary && process.env.NODE_ENV === 'production';

/**
 * Uploads a file to either Cloudinary (production with valid credentials) or local filesystem.
 * Falls back to local storage if Cloudinary upload fails.
 * @param {Express.Multer.File} file - The file object from multer
 * @returns {Promise<{url: string, filename: string, mimeType: string, size: number}>}
 */
export const uploadFile = async (file) => {
  const fileId = uuidv4();
  const filename = `${fileId}-${file.originalname}`;

  // Try Cloudinary first if configured for production
  if (USE_CLOUDINARY) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            public_id: fileId,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      console.log(`[GikpsMail] File uploaded to Cloudinary: ${file.originalname}`);
      return {
        url: result.secure_url,
        filename: fileId,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (cloudinaryError) {
      console.error(`[GikpsMail] Cloudinary upload failed for ${file.originalname}:`, cloudinaryError.message);
      console.log('[GikpsMail] Falling back to local storage...');
      // Fall through to local storage below
    }
  }

  // Save to local filesystem (works on Render for container lifetime)
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, file.buffer);

  console.log(`[GikpsMail] File saved locally: ${file.originalname} -> ${filePath}`);
  return {
    url: `${APP_URL}/uploads/${filename}`,
    filename: filename,
    mimeType: file.mimetype,
    size: file.size,
  };
};

/**
 * Deletes a file from either Cloudinary or local filesystem.
 * @param {Object} attachment - The attachment object from the database
 * @returns {Promise<void>}
 */
export const deleteFile = async (attachment) => {
  const { filename, url } = attachment;

  // If it's a Cloudinary URL, use Cloudinary deletion
  if (USE_CLOUDINARY && url && url.includes('cloudinary')) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(filename, (error, result) => {
        if (error) {
          console.error(`[GikpsMail] Cloudinary delete failed for ${filename}:`, error.message);
          return reject(error);
        }
        resolve(result);
      });
    });
  }

  // Local deletion
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

export default {
  uploadFile,
  deleteFile,
};
