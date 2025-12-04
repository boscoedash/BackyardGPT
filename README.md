# BackyardGPT
Finally building out my copilot for landscaping

## Project Structure

```
landscaping-ai/
├── .github/
│   └── workflows/
│       ├── frontend-deploy.yml
│       └── backend-deploy.yml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera/
│   │   │   ├── ImageEditor/
│   │   │   ├── DesignGallery/
│   │   │   ├── PricingEstimator/
│   │   │   └── PaymentModal/
│   │   ├── screens/
│   │   │   ├── HomeScreen.js
│   │   │   ├── ShopScreen.js
│   │   │   └── SubscriptionScreen.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── imageProcessing.js
│   │   │   ├── shopService.js
│   │   │   └── paymentService.js
│   │   └── App.js
│   ├── package.json
│   └── app.json
├── backend/
│   ├── functions/
│   │   ├── ProcessImage/
│   │   ├── GenerateDesign/
│   │   ├── GetPricing/
│   │   ├── shop/
│   │   │   ├── GetProducts/
│   │   │   ├── SearchProducts/
│   │   │   └── GetInventory/
│   │   └── payments/
│   │       ├── CreateCheckout/
│   │       ├── VerifyPayment/
│   │       └── ManageSubscription/
│   ├── shared/
│   │   ├── azure-ai.js
│   │   ├── anthropic-client.js
│   │   ├── shopData.js
│   │   └── stripe-client.js
│   ├── host.json
│   └── package.json
├── infrastructure/
│   ├── bicep/
│   │   └── main.bicep
│   └── terraform/ (alternative)
├── mock-data/
│   ├── products.json
│   └── inventory.json
└── README.md
```

## Phase 1: Initial Setup

### 1. Azure Resources Setup

```bash
# Login to Azure
az login

# Create resource group
az group create --name landscaping-ai-rg --location eastus

# Create storage account
az storage account create \
  --name landscapingaistorage \
  --resource-group landscaping-ai-rg \
  --location eastus \
  --sku Standard_LRS

# Create Cosmos DB account
az cosmosdb create \
  --name landscaping-ai-db \
  --resource-group landscaping-ai-rg

# Create Azure OpenAI resource
az cognitiveservices account create \
  --name landscaping-ai-openai \
  --resource-group landscaping-ai-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Create Function App
az functionapp create \
  --resource-group landscaping-ai-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name landscaping-ai-functions \
  --storage-account landscapingaistorage
```

### 2. Stripe Setup (Payment Integration)

```bash
# Sign up at https://stripe.com
# Get your API keys from the Stripe Dashboard
# Add to environment variables:
# - STRIPE_SECRET_KEY (for backend)
# - STRIPE_PUBLISHABLE_KEY (for frontend)

# Install Stripe CLI for local testing
brew install stripe/stripe-cli/stripe
stripe login
```

### 3. GitHub Repository Setup

```bash
# Create new repo
git init
git remote add origin https://github.com/YOUR_USERNAME/landscaping-ai.git

# Create branch protection and secrets
# Add to GitHub Secrets:
# - AZURE_CREDENTIALS
# - AZURE_OPENAI_KEY
# - AZURE_OPENAI_ENDPOINT
# - ANTHROPIC_API_KEY
# - AZURE_STORAGE_CONNECTION_STRING
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
```

### 4. Frontend Setup (React Native + Expo)

```bash
cd frontend
npx create-expo-app . --template blank
npm install @react-navigation/native @react-navigation/stack
npm install expo-camera expo-image-picker expo-file-system
npm install axios react-native-paper
npm install @azure/storage-blob
npm install @stripe/stripe-react-native
npm install react-native-iap # For iOS/Android in-app purchases (optional)
```

### 5. Backend Setup (Azure Functions)

```bash
cd backend
npm init -y
npm install @azure/functions
npm install @azure/openai
npm install @anthropic-ai/sdk
npm install @azure/cosmos
npm install @azure/storage-blob
npm install stripe
npm install dotenv
npm install uuid
```

## Phase 2: Core Features Implementation

### Feature 1: Image Capture & Upload
- Camera integration with expo-camera
- Image preview and crop functionality
- Upload to Azure Blob Storage
- Thumbnail generation

### Feature 2: AI Image Analysis
- Azure Computer Vision for yard analysis
- Identify existing features (lawn, trees, hardscape)
- Measure approximate dimensions
- Detect lighting conditions

### Feature 3: Design Generation (Freemium)
- **Free Tier**: 3 designs per month
- **Premium Tier**: Unlimited designs
- GPT-4 Vision to understand user preferences
- DALL-E 3 for design visualization
- Image-to-image transformation
- Style transfer based on reference images

### Feature 4: Cool Yard Stuff Shop
- Mock retailer with product catalog
- Product categories:
  - Plants & Trees
  - Hardscape Materials (pavers, stones, gravel)
  - Outdoor Furniture
  - Lighting
  - Tools & Equipment
  - Irrigation & Water Features
- Inventory management
- Shopping cart functionality
- Product recommendations based on design

### Feature 5: Payment Integration (Stripe)
- One-time credits purchase
- Monthly/annual subscriptions
- Payment method management
- Invoice history
- Secure checkout flow
- Webhook handling for payment events

## Freemium Model Structure

### Free Tier
- 3 AI-generated designs per month
- Basic yard analysis
- Access to Cool Yard Stuff catalog
- Save up to 5 designs
- Standard resolution images (1024x1024)

### Premium Tier ($9.99/month or $99/year)
- Unlimited AI-generated designs
- Advanced yard analysis with measurements
- Priority processing
- Unlimited saved designs
- High resolution images (1792x1024)
- Design revision history
- Export designs as PDF
- Early access to new features

### Credit Packs (Alternative/Add-on)
- 10 designs: $4.99
- 25 designs: $9.99
- 50 designs: $14.99

## Environment Variables

### Backend (.env)
```
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_ENDPOINT=your_endpoint
ANTHROPIC_API_KEY=your_key
AZURE_STORAGE_CONNECTION_STRING=your_connection
COSMOS_DB_CONNECTION_STRING=your_connection
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SHOP_TAX_RATE=0.08
```

### Frontend (.env)
```
API_BASE_URL=https://landscaping-ai-functions.azurewebsites.net
AZURE_STORAGE_ACCOUNT=landscapingaistorage
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Cool Yard Stuff Mock Data Structure

### Products Database Schema (Cosmos DB)
```json
{
  "id": "product_001",
  "name": "Japanese Maple Tree",
  "category": "plants",
  "subcategory": "trees",
  "price": 89.99,
  "unit": "each",
  "description": "Beautiful ornamental tree with red foliage",
  "imageUrl": "https://...",
  "inStock": true,
  "stockQuantity": 45,
  "dimensions": {
    "height": "6-8 feet",
    "spread": "4-6 feet"
  },
  "careLevel": "medium",
  "sunlight": "partial shade",
  "tags": ["ornamental", "shade-tree", "japanese"],
  "relatedProducts": ["product_002", "product_015"]
}
```

## CI/CD Pipeline (GitHub Actions)

### Frontend Deployment
- Build React Native app
- Run tests
- Deploy to Azure Static Web Apps or App Service
- Create preview deployments for PRs

### Backend Deployment
- Install dependencies
- Run unit tests
- Deploy Azure Functions
- Update function app settings
- Test webhook endpoints

## Development Workflow

1. **Local Development**
   ```bash
   # Frontend
   cd frontend && npm start
   
   # Backend
   cd backend && func start
   
   # Stripe webhooks (local testing)
   stripe listen --forward-to localhost:7071/api/stripe-webhook
   ```

2. **Testing Payments**
   ```bash
   # Use Stripe test cards
   # Success: 4242 4242 4242 4242
   # Decline: 4000 0000 0000 0002
   ```

3. **Deploy to Azure**
   ```bash
   # Push to main branch triggers deployment
   git push origin main
   ```

## Cost Optimization Tips

1. Use Azure OpenAI on-demand pricing initially
2. Implement image caching to reduce API calls
3. Use Azure Functions consumption plan
4. Set up budgets and alerts in Azure
5. Compress images before AI processing
6. Track user quota to prevent abuse
7. Implement rate limiting for free tier

## Database Collections

### Users Collection
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "subscriptionTier": "free", // free, premium, credits
  "stripeCustomerId": "cus_xxx",
  "designsThisMonth": 2,
  "creditsRemaining": 0,
  "subscriptionStatus": "active",
  "subscriptionEnd": "2025-01-15T00:00:00Z",
  "createdAt": "2024-12-01T00:00:00Z"
}
```

### Designs Collection
```json
{
  "id": "design_456",
  "userId": "user_123",
  "originalImageUrl": "https://...",
  "generatedImageUrl": "https://...",
  "analysis": {...},
  "designPlan": {...},
  "shoppingCart": ["product_001", "product_005"],
  "totalCost": 459.99,
  "createdAt": "2024-12-04T00:00:00Z"
}
```

### Transactions Collection
```json
{
  "id": "txn_789",
  "userId": "user_123",
  "type": "subscription", // subscription, credits, product_purchase
  "amount": 9.99,
  "currency": "usd",
  "stripePaymentId": "pi_xxx",
  "status": "succeeded",
  "createdAt": "2024-12-04T00:00:00Z"
}
```

## Next Steps

1. Set up Azure resources
2. Create GitHub repository and Stripe account
3. Initialize frontend and backend projects
4. Create Cool Yard Stuff product catalog (mock data)
5. Implement camera capture feature
6. Integrate Azure OpenAI for basic image analysis
7. Build design generation MVP with usage tracking
8. Add Stripe payment integration
9. Create shop UI and product browsing
10. Implement subscription management
11. Test and iterate

## Useful Resources

- [Azure Functions Node.js Guide](https://docs.microsoft.com/azure/azure-functions/functions-reference-node)
- [React Native Documentation](https://reactnative.dev/)
- [Azure OpenAI Service](https://docs.microsoft.com/azure/cognitive-services/openai/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Native SDK](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)