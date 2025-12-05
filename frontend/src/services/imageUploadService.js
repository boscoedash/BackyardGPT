/**
 * Image Upload Service
 * 
 * Handles uploading images to Azure Blob Storage via backend function.
 */

import apiClient from './api';

/**
 * Upload image to Azure Blob Storage
 * 
 * @param {string} imageBase64 - Base64 encoded image (with or without data URI prefix)
 * @param {string} userId - User identifier
 * @param {string} [fileName] - Optional custom filename
 * 
 * @returns {Promise<Object>} Upload result with imageUrl, imageId, and uploadedAt
 * @throws {Error} If upload fails
 * 
 * @example
 * const result = await uploadImage(imageBase64, 'user123');
 * console.log('Image uploaded:', result.imageUrl);
 */
export const uploadImage = async (imageBase64, userId, fileName = null) => {
  try {
    const response = await apiClient.post('/UploadImage', {
      imageData: imageBase64,
      userId,
      fileName,
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      if (status === 413) {
        throw new Error(`Image is too large. Maximum size is ${data.maxSizeMB || 10} MB.`);
      } else if (status === 400) {
        throw new Error(data.message || 'Invalid image data.');
      } else {
        throw new Error(data.message || 'Upload failed. Please try again.');
      }
    }
    
    throw error;
  }
};

export default {
  uploadImage,
};
