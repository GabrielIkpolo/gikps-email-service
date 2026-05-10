import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

// Ensure local upload directory exists
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Uploads a file to either Cloudinary (production) or local filesystem (development)
 * @param {Express.Multer.File} file - The file object from multer
 * @returns {Promise<{url: string, filename: string, mimeType: string, size: number}>}
 */
export const uploadFile = async (file) => {
  const fileId = uuidv4();
  const filename = `${fileId}-${file.originalname}`;

  if (process.env.NODE_ENV === 'production') {
    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          public_id: fileId,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            filename: fileId,
            mimeType: file.mimetype,
            size: file.size,
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  } else {
    // Save to local filesystem
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `${APP_URL}/uploads/${filename}`,
      filename: filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
};

/**
 * Deletes a file from either Cloudinary (production) or local filesystem (development)
 * @param {Object} attachment - The attachment object from the database
 * @returns {Promise<void>}
 */
export const deleteFile = async (attachment) => {
  const { filename } = attachment;

  if (process.env.NODE_ENV === 'production') {
    // Cloudinary deletion
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(filename, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  } else {
    // Local deletion
    const filePath = path.join(UPLOAD_DIR, filename);
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
};

export default {
  uploadFile,
  deleteFile,
};
