import multer from 'multer';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
  'application/pdf', // .pdf
  'image/jpeg', // .jpg, .jpeg
  'image/png', // .png
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.pdf', '.jpg', '.jpeg', '.png'];

// File size limit: 10MB
const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

// Configure multer with memory storage
const storage = multer.memoryStorage();

/**
 * File filter function to validate file type and extension
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new multer.MulterError(
        'LIMIT_FILE_TYPE',
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    );
  }

  // Check file extension
  const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return cb(
      new multer.MulterError(
        'LIMIT_FILE_TYPE',
        `File extension not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
      )
    );
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
  },
});

/**
 * Middleware for single file upload
 * @param {string} fieldName - Form field name for file input
 * @returns {Function} Multer middleware
 */
export function uploadSingle(fieldName) {
  return upload.single(fieldName);
}

/**
 * Middleware for multiple file uploads
 * @param {string} fieldName - Form field name for file input
 * @param {number} max - Maximum number of files to accept
 * @returns {Function} Multer middleware
 */
export function uploadMultiple(fieldName, max = 5) {
  return upload.array(fieldName, max);
}

export default {
  uploadSingle,
  uploadMultiple,
};
