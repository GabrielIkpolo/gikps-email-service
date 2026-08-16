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

// Always configure Cloudinary with real credentials if available
// Using 'demo' values causes silent failures on Render
if (hasValidCloudinary) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn('[GikpsMail] Cloudinary not configured. File uploads will use local storage only.');
}

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
  const startTime = Date.now();

  // Try Cloudinary first if configured for production with valid credentials
  if (USE_CLOUDINARY) {
    try {
      console.log(`[GikpsMail] Attempting Cloudinary upload: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`);
      
      const result = await new Promise((resolve, reject) => {
        const timeoutMs = parseInt(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS) || 180000; // Default: 3 minutes (safe for Render's 5-min HTTP limit)
        let settled = false;
        
        // Create a timeout that rejects the promise if upload takes too long
        const timeoutId = setTimeout(() => {
          if (!settled) {
            settled = true;
            console.error(`[GikpsMail] ❌ Cloudinary upload TIMEOUT after ${timeoutMs}ms for ${file.originalname}`);
            reject(new Error(`Cloudinary upload timed out after ${timeoutMs / 1000}s`));
          }
        }, timeoutMs);
        
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            public_id: fileId,
            folder: 'attachments',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (!settled) {
              settled = true;
              clearTimeout(timeoutId);
              if (error) return reject(error);
              resolve(result);
            }
          }
        );
        
        // Handle stream errors
        uploadStream.on('error', (err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            console.error(`[GikpsMail] ❌ Cloudinary stream error for ${file.originalname}:`, err.message);
            reject(err);
          }
        });
        
        uploadStream.end(file.buffer);
      });

      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[GikpsMail] ✅ File uploaded to Cloudinary: ${file.originalname} (${uploadTime}s)`);
      
      // Warn if upload took longer than 2 minutes
      if (Date.now() - startTime > 120000) {
        console.warn(`[GikpsMail] ⚠️ Cloudinary upload was SLOW: ${file.originalname} took ${uploadTime}s. Consider optimizing or using a CDN.`);
      }
      
      return {
        url: result.secure_url,
        filename: fileId,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (cloudinaryError) {
      console.error(`[GikpsMail] ❌ Cloudinary upload failed for ${file.originalname}:`, cloudinaryError.message);
      // Don't fall through - log the error and rethrow so the caller knows
      throw new Error(`Cloudinary upload failed: ${cloudinaryError.message}`);
    }
  }

  // Save to local filesystem (works on Render for container lifetime)
  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, file.buffer);

    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[GikpsMail] ✅ File saved locally: ${file.originalname} (${uploadTime}s)`);
    return {
      url: `${APP_URL}/uploads/${filename}`,
      filename: filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  } catch (localError) {
    console.error(`[GikpsMail] ❌ Local storage failed for ${file.originalname}:`, localError.message);
    throw new Error(`File upload failed: ${localError.message}`);
  }
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
