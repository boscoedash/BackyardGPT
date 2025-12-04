# Project Context for GitHub Copilot

This is a mobile-first Gen AI landscaping tool that helps users redesign their yard spaces.

## Tech Stack
- Frontend: React Native with Expo
- Backend: Azure Functions (Node.js 18+)
- AI Services: Azure OpenAI (GPT-4 Vision, DALL-E 3), Anthropic Claude API
- Storage: Azure Blob Storage, Azure Cosmos DB
- Deployment: GitHub Actions to Azure

## Code Style Preferences
- Use async/await over promises
- Prefer functional React components with hooks
- Use descriptive variable names
- Add JSDoc comments for all functions
- Handle errors gracefully with try-catch
- Log important operations for debugging

## Architecture Patterns
- RESTful API design for Azure Functions
- Component-based UI architecture
- Separation of concerns: UI, business logic, API calls
- Environment variables for all secrets and configs

## Key Features
1. Camera capture and image upload
2. AI-powered yard analysis using GPT-4 Vision
3. Design generation with Claude + DALL-E 3
4. Material pricing estimation
5. Retail product recommendations


## Specific Component Prompts

### 1. Camera Component Prompt
```javascript
// frontend/src/components/Camera/YardCamera.jsx

// Create a React Native camera component for capturing yard photos with:
// - Permission handling for camera access
// - Portrait and landscape orientation support
// - Photo preview before upload
// - Crop/zoom functionality
// - Upload to Azure Blob Storage with progress indicator
// - Error handling for denied permissions or upload failures
// - Optimized image compression for mobile upload
// Use expo-camera and expo-image-picker
```

### 2. Azure Function Prompt
```javascript
// backend/functions/AnalyzeYard/index.js

// Create an Azure HTTP Function that:
// - Accepts a POST request with image URL and user preferences
// - Uses Azure OpenAI GPT-4 Vision to analyze yard features
// - Identifies: lawn condition, existing plants, hardscape, sun exposure, dimensions
// - Returns structured JSON with analysis results
// - Includes comprehensive error handling and logging
// - Implements retry logic for API calls
// - Uses environment variables for API keys
```

### 3. Design Generation Service Prompt
```javascript
// frontend/src/services/designService.js

// Create a service module for design generation that:
// - Uploads images to Azure Blob Storage
// - Calls the GenerateDesign Azure Function
// - Handles loading states and progress updates
// - Implements request cancellation
// - Caches results locally to avoid redundant API calls
// - Returns typed response objects
// - Includes comprehensive error handling with user-friendly messages
```

### 4. Pricing Estimator Prompt
```javascript
// backend/functions/CalculatePricing/index.js

// Create an Azure Function for material pricing that:
// - Accepts a list of landscaping materials with quantities
// - Integrates with Home Depot and Lowe's product APIs
// - Calculates total cost estimates
// - Finds nearest store locations with inventory
// - Returns comparison pricing from multiple retailers
// - Handles API rate limits gracefully
// - Caches product pricing for 24 hours
```

### 5. Design Gallery UI Prompt
```javascript
// frontend/src/screens/DesignGallery.jsx

// Create a React Native screen component for viewing saved designs:
// - Grid layout with thumbnail images
// - Pull-to-refresh functionality
// - Infinite scroll pagination
// - Filter by date, style, or price range
// - Swipe to delete designs
// - Share design functionality
// - Before/after comparison slider
// - Material design principles with smooth animations
```

### 6. Image Processing Utility Prompt
```javascript
// frontend/src/utils/imageProcessing.js

// Create utility functions for image processing:
// - Resize images to optimal dimensions for AI processing
// - Compress images while maintaining quality (target < 5MB)
// - Convert HEIC to JPEG on iOS
// - Generate thumbnails
// - Extract EXIF data (location, orientation)
// - Validate image dimensions and format
// - Calculate aspect ratios
```

### 7. Database Schema Prompt
```javascript
// backend/shared/models/design.js

// Create a Cosmos DB data model for user designs:
// - User ID (partition key)
// - Design ID (unique identifier)
// - Original image URL
// - Generated design URLs (multiple variations)
// - Yard analysis data
// - Design plan (plants, hardscape, materials)
// - Pricing breakdown
// - Timestamps (created, modified)
// - Design style and preferences
// - Include CRUD operations with proper error handling
```

### 8. GitHub Actions Workflow Prompt
```yaml
# .github/workflows/deploy-backend.yml

# Create a GitHub Actions workflow that:
# - Triggers on push to main branch for backend/ directory
# - Runs on ubuntu-latest
# - Installs Node.js 18
# - Installs dependencies
# - Runs tests with coverage reporting
# - Deploys to Azure Functions using Azure/functions-action
# - Uses secrets for Azure credentials
# - Sends deployment notifications
# - Includes rollback capability on failure
```

### 9. API Client Prompt
```javascript
// frontend/src/services/api.js

// Create an API client for Azure Functions with:
// - Axios instance with base configuration
// - Request/response interceptors for auth tokens
// - Automatic retry logic with exponential backoff
// - Request timeout handling (30 seconds)
// - Network error detection and user-friendly messages
// - Request cancellation support
// - TypeScript-style JSDoc annotations
// - Development/production environment switching
```

### 10. Retail Integration Prompt
```javascript
// backend/shared/retailers/homeDepotClient.js

// Create a Home Depot API integration module that:
// - Searches products by name or SKU
// - Retrieves product details (price, availability, description)
// - Finds nearby stores with inventory
// - Gets bulk pricing for large quantities
// - Handles API authentication and rate limiting
// - Caches frequent queries
// - Provides fallback for API failures
// - Maps our material types to Home Depot categories
```

## Pro Tips for Using These Prompts

1. **Start files with the prompt as a comment** - Copilot reads file context
2. **Be specific about dependencies** - Mention exact libraries you want to use
3. **Include constraints** - Mention mobile optimization, error handling needs
4. **Request structure** - Ask for specific patterns (hooks, async/await, etc.)
5. **Add examples** - If you have a preferred code style, show a small example
6. **Iterate** - Accept suggestion, then add a comment asking for refinements

## Multi-File Generation Strategy

1. Create the file with the comment prompt
2. Press Enter and let Copilot generate
3. Review and accept useful parts
4. Add refinement comments for missing pieces
5. Move to the next file

## Example Workflow

```bash
# 1. Create file structure
mkdir -p frontend/src/components/Camera
touch frontend/src/components/Camera/YardCamera.jsx

# 2. Open file and paste camera component prompt
# 3. Let Copilot generate
# 4. Review and refine
# 5. Repeat for next component
```

## Copilot Chat Prompts

Use these in Copilot Chat for bigger picture questions:

```
@workspace How should I structure the API routes for this landscaping app?

@workspace Generate a comprehensive error handling strategy for Azure Function failures

@workspace What's the best way to handle image upload progress in React Native?

@workspace Create a testing strategy for the AI image generation feature

@workspace How can I optimize API costs for Azure OpenAI in production?
```

## Cool Yard Stuff Shop Prompts

### 11. Shop Frontend Component
```javascript
// frontend/src/screens/ShopScreen.jsx

// Create a React Native shop screen for "Cool Yard Stuff" with:
// - Product grid with images, names, and prices
// - Category filters (Plants, Hardscape, Furniture, Lighting, etc.)
// - Search bar with real-time filtering
// - Shopping cart icon with item count badge
// - Product detail modal on tap
// - "Add to Cart" functionality with quantity selector
// - "Recommended for Your Design" section
// - Pull-to-refresh
// - Smooth animations and transitions
```

### 12. Shopping Cart Component
```javascript
// frontend/src/components/ShoppingCart/Cart.jsx

// Create a React Native shopping cart component with:
// - List of cart items with images and prices
// - Quantity adjustment (+ / - buttons)
// - Remove item functionality with swipe gesture
// - Subtotal, tax, and total calculation
// - "Checkout" button that initiates Stripe payment
// - Empty cart state with CTA to browse products
// - Save cart to local storage for persistence
// - Estimated delivery date display
```

### 13. Payment Integration Component
```javascript
// frontend/src/components/Payment/CheckoutModal.jsx

// Create a Stripe checkout modal for React Native with:
// - Integration with @stripe/stripe-react-native
// - Display order summary before payment
// - Stripe CardField for payment input
// - Support for Apple Pay and Google Pay
// - Loading state during payment processing
// - Success/failure handling with user feedback
// - Error handling for declined cards
// - Redirect to order confirmation screen on success
```

### 14. Subscription Management Screen
```javascript
// frontend/src/screens/SubscriptionScreen.jsx

// Create a subscription management screen with:
// - Current plan display (Free/Premium/Credits)
// - Usage statistics (designs this month, credits remaining)
// - Pricing cards for Premium plans (monthly/annual)
// - Credit pack purchase options
// - "Upgrade" and "Manage Subscription" buttons
// - Cancel subscription functionality with confirmation
// - Billing history list
// - Payment method management
// - Feature comparison table (Free vs Premium)
```

### 15. Shop API Functions
```javascript
// backend/functions/shop/GetProducts/index.js

// Create an Azure Function for product retrieval with:
// - Get all products with pagination (20 per page)
// - Filter by category, subcategory, price range
// - Search functionality across name, description, tags
// - Sort options (price, name, popularity, newest)
// - Product recommendations based on user's design
// - Include related products for cross-selling
// - Cache frequently accessed products
// - Return proper HTTP status codes
```

### 16. Stripe Setup Script
```javascript
// scripts/setup-stripe-products.js

// Create a Node.js script to set up Stripe products and prices:
// - Create Product objects for subscription plans
// - Create Price objects for monthly ($9.99) and annual ($99.99)
// - Create Products for credit packs (10, 25, 50 credits)
// - Output Price IDs to console for environment variables
// - Handle idempotency (check if products already exist)
// - Create test mode and production mode variants
// - Export configuration as JSON
```

### 17. Usage Tracking Middleware
```javascript
// backend/shared/middleware/usageTracker.js

// Create middleware for tracking design generation usage:
// - Check user's subscription tier and credit balance
// - For free tier: verify monthly limit (3 designs)
// - For premium tier: allow unlimited designs
// - For credit users: deduct 1 credit per design
// - Reset monthly counters on first of each month
// - Return clear error messages when limit reached
// - Log usage events to Cosmos DB
// - Handle concurrent request edge cases
```

## Quick Start Sequence

Use these prompts in order for fastest setup:

1. **Project Structure**: `@workspace /new Create a React Native project with Azure Functions backend for a landscaping design app with Stripe payments`
2. **Package Setup**: `Generate package.json with all dependencies for React Native app using Expo, Azure Blob Storage, Stripe, and axios`
3. **Environment Config**: `Create environment configuration files for development and production with Azure endpoints and Stripe keys`
4. **Mock Shop Data**: Use the Cool Yard Stuff product catalog (already created)
5. **Camera Component**: Use prompt #1 above
6. **Shop Screen**: Use prompt #11 above
7. **Payment Integration**: Use prompts #13 and #14 above
8. **API Client**: Use prompt #9 above
9. **First Function**: Use prompt #2 above
10. **Stripe Setup**: Use prompt #16 above

Start with these and you'll have a working skeleton with payments in 2-3 hours!