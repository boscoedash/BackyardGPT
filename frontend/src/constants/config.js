/**
 * App Configuration Constants
 * 
 * Centralized configuration for API endpoints, limits, and app settings.
 */

export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'https://landscaping-ai-functions.azurewebsites.net',
  TIMEOUT: 30000, // 30 seconds
};

export const STORAGE_CONFIG = {
  ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT || 'landscapingaistorage',
  CONTAINER_NAME: 'yard-images',
};

export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || 'your_stripe_publishable_key_here',
};

export const IMAGE_CONSTRAINTS = {
  MAX_SIZE_MB: 10,
  MAX_DIMENSION_PX: 4096,
  COMPRESSION_WIDTH: 1024,
  COMPRESSION_QUALITY: 0.8,
  ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'heic'],
};

export const PRICING = {
  subscription: {
    monthly: 999,  // $9.99 in cents
    annual: 9999,  // $99.99 in cents
  },
  credits: {
    pack_10: { price: 499, credits: 10 },
    pack_25: { price: 999, credits: 25 },
    pack_50: { price: 1499, credits: 50 },
  },
};

export const FREE_TIER_LIMIT = 3;
