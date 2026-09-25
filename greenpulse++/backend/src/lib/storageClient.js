const fs = require('fs');
const path = require('path');
const { admin, isInitialized } = require('../config/firebase');
const env = require('../config/env');
const logger = require('./logger');

/**
 * Storage Client for Compliance Report PDFs
 * Handles Firebase Cloud Storage with strict environment isolation.
 */
class StorageClient {
  constructor() {
    this.isProduction = env.NODE_ENV === 'production';
    this.localStorageDir = path.resolve(__dirname, '../../storage');
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET || (env.FIREBASE_PROJECT_ID ? `${env.FIREBASE_PROJECT_ID}.appspot.com` : null);
  }

  /**
   * Check if Firebase Storage is available
   */
  isFirebaseStorageAvailable() {
    return isInitialized() && Boolean(this.bucketName);
  }

  /**
   * Upload PDF buffer to Firebase Storage or local fallback (dev/test only)
   *
   * @param {Buffer} buffer - PDF binary data
   * @param {string} storageRef - Target private object path (e.g. reports/{companyId}/{reportId}_{period}.pdf)
   * @returns {Promise<{ storageRef: string, isLocal: boolean }>}
   */
  async uploadPdf(buffer, storageRef) {
    if (this.isProduction && !this.isFirebaseStorageAvailable()) {
      const err = new Error('Production configuration violation: Firebase Storage is mandatory in production');
      logger.error({ err: err.message }, 'Firebase Storage missing in production');
      throw err;
    }

    if (this.isFirebaseStorageAvailable()) {
      try {
        const bucket = admin.storage().bucket(this.bucketName);
        const file = bucket.file(storageRef);

        await file.save(buffer, {
          metadata: {
            contentType: 'application/pdf',
            metadata: {
              uploadedBy: 'GreenPulse-AI-Report-Engine',
              createdAt: new Date().toISOString(),
            },
          },
          resumable: false,
        });

        logger.info({ storageRef, bucket: this.bucketName }, 'PDF uploaded to Firebase Storage');
        return { storageRef, isLocal: false };
      } catch (err) {
        if (this.isProduction) {
          logger.error({ err: err.message, storageRef }, 'Failed to upload PDF to Firebase Storage in production');
          throw err;
        }
        logger.warn({ err: err.message, storageRef }, 'Firebase Storage upload failed; falling back to local storage in dev/test');
      }
    }

    // Dev/Test Local Fallback
    const localFilePath = path.join(this.localStorageDir, storageRef);
    const parentDir = path.dirname(localFilePath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(localFilePath, buffer);
    logger.info({ storageRef, localFilePath }, 'PDF saved to local storage fallback');
    return { storageRef, isLocal: true };
  }

  /**
   * Generate short-lived signed download URL (15 minutes)
   *
   * @param {string} storageRef - Private object path
   * @param {number} expiresInMinutes - Expiry duration in minutes (default 15)
   * @returns {Promise<{ downloadUrl: string, expiresIn: string, isLocal: boolean }>}
   */
  async getSignedDownloadUrl(storageRef, expiresInMinutes = 15) {
    if (this.isFirebaseStorageAvailable()) {
      try {
        const bucket = admin.storage().bucket(this.bucketName);
        const file = bucket.file(storageRef);

        const [exists] = await file.exists();
        if (exists) {
          const expiresMs = Date.now() + expiresInMinutes * 60 * 1000;
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: expiresMs,
          });

          return {
            downloadUrl: url,
            expiresIn: `${expiresInMinutes}m`,
            isLocal: false,
          };
        }
      } catch (err) {
        logger.warn({ err: err.message, storageRef }, 'Failed to generate Firebase signed URL, checking local storage');
      }
    }

    // Check local fallback
    const localFilePath = path.join(this.localStorageDir, storageRef);
    if (fs.existsSync(localFilePath)) {
      return {
        downloadUrl: `/api/v1/reports/download-local?ref=${encodeURIComponent(storageRef)}`,
        expiresIn: `${expiresInMinutes}m`,
        isLocal: true,
        localFilePath,
      };
    }

    throw new Error(`Report PDF file not found for reference: ${storageRef}`);
  }

  /**
   * Read raw PDF buffer from storage (used for local streaming or verification tests)
   *
   * @param {string} storageRef
   * @returns {Promise<Buffer>}
   */
  async readPdf(storageRef) {
    if (this.isFirebaseStorageAvailable()) {
      try {
        const bucket = admin.storage().bucket(this.bucketName);
        const file = bucket.file(storageRef);
        const [exists] = await file.exists();
        if (exists) {
          const [buffer] = await file.download();
          return buffer;
        }
      } catch (err) {
        logger.warn({ err: err.message, storageRef }, 'Could not read from Firebase Storage, checking local');
      }
    }

    const localFilePath = path.join(this.localStorageDir, storageRef);
    if (fs.existsSync(localFilePath)) {
      return fs.readFileSync(localFilePath);
    }

    throw new Error(`Report PDF not found on disk or Firebase Storage: ${storageRef}`);
  }
}

module.exports = new StorageClient();
