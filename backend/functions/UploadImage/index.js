/**
 * UploadImage Azure Function
 * 
 * Accepts base64 image data and uploads to Azure Blob Storage.
 * Validates image size, generates unique filenames, and handles errors.
 * 
 * @param {Object} request - HTTP request with JSON body
 * @param {string} request.imageData - Base64 encoded image string
 * @param {string} request.userId - User identifier
 * @param {string} [request.fileName] - Optional custom filename
 * 
 * @returns {Object} Response with imageUrl, imageId, and uploadedAt timestamp
 */

const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

// Constants
const CONTAINER_NAME = 'yard-images';
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

/**
 * Validates base64 string format
 * 
 * @param {string} base64String - String to validate
 * @returns {boolean} True if valid base64
 */
const isValidBase64 = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }
  
  // Remove data URI prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  
  // Check if string matches base64 pattern
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(base64Data);
};

/**
 * Converts base64 string to buffer
 * 
 * @param {string} base64String - Base64 encoded string
 * @returns {Buffer} Decoded buffer
 */
const base64ToBuffer = (base64String) => {
  // Remove data URI prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

/**
 * Generates unique filename for uploaded image
 * 
 * @param {string} userId - User identifier
 * @param {string} [customFileName] - Optional custom filename
 * @returns {string} Unique filename in format: userId_timestamp_uuid.jpg
 */
const generateUniqueFileName = (userId, customFileName) => {
  if (customFileName) {
    // Sanitize custom filename
    const sanitized = customFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return sanitized.endsWith('.jpg') ? sanitized : `${sanitized}.jpg`;
  }
  
  const timestamp = Date.now();
  const randomId = uuidv4();
  return `${userId}_${timestamp}_${randomId}.jpg`;
};

/**
 * Uploads buffer to Azure Blob Storage with retry logic
 * 
 * @param {BlobServiceClient} blobServiceClient - Azure Blob Service client
 * @param {string} containerName - Container name
 * @param {string} fileName - Blob filename
 * @param {Buffer} buffer - Image buffer
 * @param {Object} context - Azure Functions context for logging
 * @returns {Promise<string>} URL of uploaded blob
 */
const uploadWithRetry = async (blobServiceClient, containerName, fileName, buffer, context) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      context.log(`Upload attempt ${attempt} for ${fileName}`);
      
      // Upload with content type
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: 'image/jpeg',
        },
      });
      
      context.log(`Successfully uploaded ${fileName} on attempt ${attempt}`);
      return blockBlobClient.url;
      
    } catch (error) {
      context.log.error(`Upload attempt ${attempt} failed:`, error.message);
      
      if (attempt === MAX_RETRIES) {
        throw new Error(`Upload failed after ${MAX_RETRIES} attempts: ${error.message}`);
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      context.log(`Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

/**
 * Main Azure Function handler
 */
app.http('UploadImage', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      context.log('UploadImage function triggered');
      
      // Parse request body
      let requestBody;
      try {
        requestBody = await request.json();
      } catch (error) {
        context.log.error('Invalid JSON in request body');
        return {
          status: 400,
          jsonBody: {
            error: 'Invalid request',
            message: 'Request body must be valid JSON'
          }
        };
      }
      
      const { imageData, userId, fileName } = requestBody;
      
      // Validate required fields
      if (!imageData || !userId) {
        context.log.error('Missing required fields');
        return {
          status: 400,
          jsonBody: {
            error: 'Missing required fields',
            message: 'Both imageData and userId are required'
          }
        };
      }
      
      // Validate userId format
      if (typeof userId !== 'string' || userId.trim().length === 0) {
        context.log.error('Invalid userId format');
        return {
          status: 400,
          jsonBody: {
            error: 'Invalid userId',
            message: 'userId must be a non-empty string'
          }
        };
      }
      
      // Validate base64 format
      if (!isValidBase64(imageData)) {
        context.log.error('Invalid base64 image data');
        return {
          status: 400,
          jsonBody: {
            error: 'Invalid image data',
            message: 'imageData must be a valid base64 encoded string'
          }
        };
      }
      
      // Convert base64 to buffer
      let imageBuffer;
      try {
        imageBuffer = base64ToBuffer(imageData);
      } catch (error) {
        context.log.error('Failed to decode base64:', error.message);
        return {
          status: 400,
          jsonBody: {
            error: 'Invalid image data',
            message: 'Failed to decode base64 image data'
          }
        };
      }
      
      // Check image size
      const imageSizeBytes = imageBuffer.length;
      const imageSizeMB = (imageSizeBytes / (1024 * 1024)).toFixed(2);
      
      context.log(`Image size: ${imageSizeMB} MB (${imageSizeBytes} bytes)`);
      
      if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
        context.log.error(`Image too large: ${imageSizeMB} MB (max: ${MAX_IMAGE_SIZE_MB} MB)`);
        return {
          status: 413,
          jsonBody: {
            error: 'Image too large',
            message: `Image size (${imageSizeMB} MB) exceeds maximum allowed size of ${MAX_IMAGE_SIZE_MB} MB`,
            maxSizeMB: MAX_IMAGE_SIZE_MB,
            actualSizeMB: parseFloat(imageSizeMB)
          }
        };
      }
      
      // Get connection string from environment
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connectionString) {
        context.log.error('AZURE_STORAGE_CONNECTION_STRING not configured');
        return {
          status: 500,
          jsonBody: {
            error: 'Configuration error',
            message: 'Storage connection string not configured'
          }
        };
      }
      
      // Initialize Blob Service Client
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      
      // Ensure container exists
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      await containerClient.createIfNotExists({
        access: 'blob', // Make blobs publicly readable
      });
      
      // Generate unique filename
      const uniqueFileName = generateUniqueFileName(userId, fileName);
      context.log(`Generated filename: ${uniqueFileName}`);
      
      // Upload with retry logic
      let imageUrl;
      try {
        imageUrl = await uploadWithRetry(
          blobServiceClient,
          CONTAINER_NAME,
          uniqueFileName,
          imageBuffer,
          context
        );
      } catch (error) {
        context.log.error('Upload failed:', error.message);
        return {
          status: 500,
          jsonBody: {
            error: 'Upload failed',
            message: error.message
          }
        };
      }
      
      // Generate response
      const uploadedAt = new Date().toISOString();
      const imageId = uniqueFileName.replace('.jpg', '');
      
      context.log(`Successfully uploaded image: ${imageUrl}`);
      
      return {
        status: 200,
        jsonBody: {
          imageUrl,
          imageId,
          uploadedAt,
          sizeBytes: imageSizeBytes,
          sizeMB: parseFloat(imageSizeMB)
        }
      };
      
    } catch (error) {
      context.log.error('Unexpected error:', error);
      return {
        status: 500,
        jsonBody: {
          error: 'Internal server error',
          message: 'An unexpected error occurred during image upload'
        }
      };
    }
  }
});
