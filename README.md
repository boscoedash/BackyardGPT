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
│   │   │   └── PricingEstimator/
│   │   ├── screens/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── imageProcessing.js
│   │   └── App.js
│   ├── package.json
│   └── app.json
├── backend/
│   ├── functions/
│   │   ├── ProcessImage/
│   │   ├── GenerateDesign/
│   │   ├── GetPricing/
│   │   └── SearchRetailers/
│   ├── shared/
│   │   ├── azure-ai.js
│   │   └── anthropic-client.js
│   ├── host.json
│   └── package.json
├── infrastructure/
│   ├── bicep/
│   │   └── main.bicep
│   └── terraform/ (alternative)
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

### 2. GitHub Repository Setup

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
```

### 3. Frontend Setup (React Native + Expo)

```bash
cd frontend
npx create-expo-app . --template blank
npm install @react-navigation/native @react-navigation/stack
npm install expo-camera expo-image-picker expo-file-system
npm install axios react-native-paper
npm install @azure/storage-blob
```

### 4. Backend Setup (Azure Functions)

```bash
cd backend
npm init -y
npm install @azure/functions
npm install @azure/openai
npm install @anthropic-ai/sdk
npm install @azure/cosmos
npm install @azure/storage-blob
npm install dotenv
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

### Feature 3: Design Generation
- GPT-4 Vision to understand user preferences
- DALL-E 3 for design visualization
- Image-to-image transformation
- Style transfer based on reference images

### Feature 4: Pricing & Retail Integration
- Material quantity estimation
- Price lookup from retail APIs:
  - Home Depot API
  - Lowe's Product API
  - Local nursery databases
- Shopping list generation
- Store locator with inventory check

## Environment Variables

### Backend (.env)
```
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_ENDPOINT=your_endpoint
ANTHROPIC_API_KEY=your_key
AZURE_STORAGE_CONNECTION_STRING=your_connection
COSMOS_DB_CONNECTION_STRING=your_connection
HOME_DEPOT_API_KEY=your_key
```

### Frontend (.env)
```
API_BASE_URL=https://landscaping-ai-functions.azurewebsites.net
AZURE_STORAGE_ACCOUNT=landscapingaistorage
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

## Development Workflow

1. **Local Development**
   ```bash
   # Frontend
   cd frontend && npm start
   
   # Backend
   cd backend && func start
   ```

2. **Testing**
   ```bash
   npm test
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

## Next Steps

1. Set up Azure resources
2. Create GitHub repository
3. Initialize frontend and backend projects
4. Implement camera capture feature
5. Integrate Azure OpenAI for basic image analysis
6. Build design generation MVP
7. Add pricing estimation feature
8. Test and iterate

## Useful Resources

- [Azure Functions Node.js Guide](https://docs.microsoft.com/azure/azure-functions/functions-reference-node)
- [React Native Documentation](https://reactnative.dev/)
- [Azure OpenAI Service](https://docs.microsoft.com/azure/cognitive-services/openai/)
- [Anthropic Claude API](https://docs.anthropic.com/)