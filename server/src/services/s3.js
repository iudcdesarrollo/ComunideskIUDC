import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import config from '../config/index.js';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = config.AWS_S3_BUCKET;

/**
 * Ensure S3 bucket exists, create if not
 */
async function ensureBucket() {
  try {
    // Check if bucket exists
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: BUCKET_NAME,
      })
    );
    console.log(`✓ S3 bucket "${BUCKET_NAME}" exists`);
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      try {
        // Create bucket if it doesn't exist
        await s3Client.send(
          new CreateBucketCommand({
            Bucket: BUCKET_NAME,
          })
        );
        console.log(`✓ S3 bucket "${BUCKET_NAME}" created successfully`);
      } catch (createError) {
        console.error(`✗ Failed to create S3 bucket: ${createError.message}`);
        throw createError;
      }
    } else if (error.$metadata?.httpStatusCode === 403) {
      // Credentials might be invalid - log warning but continue
      console.warn(`⚠️  S3 authentication failed (403): ${error.message}`);
      console.warn('   Ensure AWS credentials are valid. S3 uploads may fail.');
    } else {
      console.error(`✗ Error checking S3 bucket: ${error.message}`);
      throw error;
    }
  }
}

// Ensure bucket exists on module load
await ensureBucket();

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type of file
 * @param {string} folder - S3 folder path (default: 'uploads')
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadFile(
  fileBuffer,
  originalName,
  mimeType,
  folder = 'uploads'
) {
  try {
    // Generate unique key with timestamp
    const key = `${folder}/${Date.now()}-${originalName}`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    );

    // Return public URL
    const url = `https://${BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
    return url;
  } catch (error) {
    console.error(`✗ S3 upload failed: ${error.message}`);
    throw error;
  }
}

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export async function deleteFile(key) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    console.log(`✓ File deleted from S3: ${key}`);
  } catch (error) {
    console.error(`✗ S3 delete failed: ${error.message}`);
    throw error;
  }
}

export default {
  uploadFile,
  deleteFile,
};
