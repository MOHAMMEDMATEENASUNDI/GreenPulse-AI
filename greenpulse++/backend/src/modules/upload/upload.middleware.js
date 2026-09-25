const multer = require('multer');
const path = require('path');
const AppError = require('../../utils/AppError');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/csv',
  'text/plain',
  'application/octet-stream',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError(
        `Invalid file type '${ext}'. Only CSV (.csv) and Excel (.xlsx, .xls) files are accepted.`,
        400,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && file.mimetype !== 'application/octet-stream') {
    return cb(
      new AppError(
        `Invalid MIME type '${file.mimetype}'. Only CSV and Excel files are accepted.`,
        400,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

const uploadSingleFile = (fieldName = 'file') => (req, res, next) => {
  const uploadHandler = upload.single(fieldName);

  uploadHandler(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size exceeds the 10MB limit', 400, 'FILE_TOO_LARGE'));
        }
        return next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
      }
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No file was provided in the upload request', 400, 'FILE_REQUIRED'));
    }

    return next();
  });
};

module.exports = {
  uploadSingleFile,
  MAX_FILE_SIZE,
};
