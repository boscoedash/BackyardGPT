#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup script for BackyardGPT Azure resources and project initialization
.DESCRIPTION
    This script automates the creation of Azure resources and project setup for the landscaping AI application
.NOTES
    Requires Azure CLI to be installed and configured
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "landscaping-ai-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$StorageAccount = "landscapingaistorage",
    
    [Parameter(Mandatory=$false)]
    [string]$CosmosDBAccount = "landscaping-ai-db",
    
    [Parameter(Mandatory=$false)]
    [string]$OpenAIAccount = "landscaping-ai-openai",
    
    [Parameter(Mandatory=$false)]
    [string]$FunctionApp = "landscaping-ai-functions",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipAzureResources,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipProjectInit
)

$ErrorActionPreference = "Stop"

# Color output functions
function Write-Step {
    param([string]$Message)
    Write-Host "`n===> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-ErrorCustom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
Write-Step "Checking prerequisites..."

# Check Azure CLI
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Success "Azure CLI is installed (version $($azVersion.'azure-cli'))"
} catch {
    Write-ErrorCustom "Azure CLI is not installed. Please install from https://aka.ms/installazurecliwindows"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Success "Node.js is installed ($nodeVersion)"
} catch {
    Write-ErrorCustom "Node.js is not installed. Please install from https://nodejs.org/"
    exit 1
}

# Check Git
try {
    $gitVersion = git --version 2>$null
    Write-Success "Git is installed ($gitVersion)"
} catch {
    Write-ErrorCustom "Git is not installed. Please install from https://git-scm.com/"
    exit 1
}

if (-not $SkipAzureResources) {
    # Login to Azure
    Write-Step "Logging in to Azure..."
    az login
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorCustom "Azure login failed"
        exit 1
    }
    Write-Success "Successfully logged in to Azure"
    
    # Create resource group
    Write-Step "Creating resource group '$ResourceGroup'..."
    az group create --name $ResourceGroup --location $Location --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Resource group created"
    } else {
        Write-ErrorCustom "Failed to create resource group"
        exit 1
    }
    
    # Create storage account
    Write-Step "Creating storage account '$StorageAccount'..."
    az storage account create `
        --name $StorageAccount `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Standard_LRS `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Storage account created"
    } else {
        Write-ErrorCustom "Failed to create storage account"
        exit 1
    }
    
    # Create Cosmos DB account
    Write-Step "Creating Cosmos DB account '$CosmosDBAccount' (this may take several minutes)..."
    az cosmosdb create `
        --name $CosmosDBAccount `
        --resource-group $ResourceGroup `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Cosmos DB account created"
    } else {
        Write-ErrorCustom "Failed to create Cosmos DB account"
        exit 1
    }
    
    # Create Azure OpenAI resource
    Write-Step "Creating Azure OpenAI resource '$OpenAIAccount'..."
    az cognitiveservices account create `
        --name $OpenAIAccount `
        --resource-group $ResourceGroup `
        --kind OpenAI `
        --sku S0 `
        --location $Location `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Azure OpenAI resource created"
    } else {
        Write-ErrorCustom "Failed to create Azure OpenAI resource"
        exit 1
    }
    
    # Create Function App
    Write-Step "Creating Function App '$FunctionApp'..."
    az functionapp create `
        --resource-group $ResourceGroup `
        --consumption-plan-location $Location `
        --runtime node `
        --runtime-version 24 `
        --functions-version 4 `
        --name $FunctionApp `
        --storage-account $StorageAccount `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Function App created"
    } else {
        Write-ErrorCustom "Failed to create Function App"
        exit 1
    }
    
    # Retrieve connection strings and keys
    Write-Step "Retrieving connection strings and keys..."
    
    $storageConnectionString = az storage account show-connection-string `
        --name $StorageAccount `
        --resource-group $ResourceGroup `
        --query connectionString `
        --output tsv
    
    $cosmosConnectionString = az cosmosdb keys list `
        --name $CosmosDBAccount `
        --resource-group $ResourceGroup `
        --type connection-strings `
        --query "connectionStrings[0].connectionString" `
        --output tsv
    
    $openAIKey = az cognitiveservices account keys list `
        --name $OpenAIAccount `
        --resource-group $ResourceGroup `
        --query key1 `
        --output tsv
    
    $openAIEndpoint = az cognitiveservices account show `
        --name $OpenAIAccount `
        --resource-group $ResourceGroup `
        --query properties.endpoint `
        --output tsv
    
    Write-Success "Retrieved all connection strings and keys"
    
    # Create .env file for backend
    Write-Step "Creating backend .env file..."
    $backendEnvContent = @"
AZURE_OPENAI_KEY=$openAIKey
AZURE_OPENAI_ENDPOINT=$openAIEndpoint
ANTHROPIC_API_KEY=your_anthropic_key_here
AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString
COSMOS_DB_CONNECTION_STRING=$cosmosConnectionString
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
"@
    
    if (-not (Test-Path "backend")) {
        New-Item -ItemType Directory -Path "backend" -Force | Out-Null
    }
    Set-Content -Path "backend\.env" -Value $backendEnvContent
    Write-Success "Backend .env file created"
    
    # Create .env file for frontend
    Write-Step "Creating frontend .env file..."
    $frontendEnvContent = @"
API_BASE_URL=https://$FunctionApp.azurewebsites.net
AZURE_STORAGE_ACCOUNT=$StorageAccount
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
"@
    
    if (-not (Test-Path "frontend")) {
        New-Item -ItemType Directory -Path "frontend" -Force | Out-Null
    }
    Set-Content -Path "frontend\.env" -Value $frontendEnvContent
    Write-Success "Frontend .env file created"
    
    Write-Host "`n" -NoNewline
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "IMPORTANT: Update these API keys manually:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "1. Add your Anthropic API key to backend\.env" -ForegroundColor Yellow
    Write-Host "2. Add your Stripe keys to backend\.env and frontend\.env" -ForegroundColor Yellow
    Write-Host "   - Get keys from https://dashboard.stripe.com/apikeys" -ForegroundColor Yellow
    Write-Host "`n"
}

if (-not $SkipProjectInit) {
    # Initialize Git repository if not already initialized
    if (-not (Test-Path ".git")) {
        Write-Step "Initializing Git repository..."
        git init
        Write-Success "Git repository initialized"
    } else {
        Write-Success "Git repository already initialized"
    }
    
    # Frontend setup
    Write-Step "Setting up frontend (React Native + Expo)..."
    if (-not (Test-Path "frontend\package.json")) {
        Set-Location frontend
        
        Write-Host "Creating Expo app..."
        npx create-expo-app@latest . --template blank --yes
        
        Write-Host "Installing dependencies..."
        npm install @react-navigation/native @react-navigation/stack
        npm install expo-camera expo-image-picker expo-file-system
        npm install axios react-native-paper
        npm install @azure/storage-blob
        npm install "@stripe/stripe-react-native"
        
        Set-Location ..
        Write-Success "Frontend setup complete"
    } else {
        Write-Success "Frontend already initialized"
    }
    
    # Backend setup
    Write-Step "Setting up backend (Azure Functions)..."
    if (-not (Test-Path "backend\package.json")) {
        Set-Location backend
        
        npm init -y
        npm install @azure/functions
        npm install @azure/openai
        npm install "@anthropic-ai/sdk"
        npm install @azure/cosmos
        npm install @azure/storage-blob
        npm install stripe
        npm install dotenv
        npm install uuid
        
        Set-Location ..
        Write-Success "Backend setup complete"
    } else {
        Write-Success "Backend already initialized"
    }
    
    # Create .gitignore if it doesn't exist
    if (-not (Test-Path ".gitignore")) {
        Write-Step "Creating .gitignore file..."
        $gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.*.local

# Build output
dist/
build/
.expo/
.expo-shared/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Azure Functions
local.settings.json
__blobstorage__/
__queuestorage__/
__azurite_db*__.json
.python_packages/

# Logs
*.log
logs/
"@
        Set-Content -Path ".gitignore" -Value $gitignoreContent
        Write-Success ".gitignore file created"
    }
    
    # Create mock-data directory with sample data
    Write-Step "Creating mock data directory..."
    if (-not (Test-Path "mock-data")) {
        New-Item -ItemType Directory -Path "mock-data" -Force | Out-Null
        
        $productsJson = @"
{
  "products": [
    {
      "id": "1",
      "name": "Japanese Maple Tree",
      "category": "Plants & Trees",
      "price": 89.99,
      "description": "Beautiful ornamental tree with red foliage",
      "inStock": true,
      "image": "https://example.com/japanese-maple.jpg"
    },
    {
      "id": "2",
      "name": "Paver Stones (Box of 24)",
      "category": "Hardscape Materials",
      "price": 149.99,
      "description": "Natural stone pavers for pathways and patios",
      "inStock": true,
      "image": "https://example.com/pavers.jpg"
    },
    {
      "id": "3",
      "name": "Solar Garden Lights (Set of 6)",
      "category": "Lighting",
      "price": 39.99,
      "description": "Energy-efficient pathway lights",
      "inStock": true,
      "image": "https://example.com/lights.jpg"
    }
  ]
}
"@
        Set-Content -Path "mock-data\products.json" -Value $productsJson
        
        $inventoryJson = @"
{
  "inventory": [
    {"productId": "1", "quantity": 25, "warehouse": "West"},
    {"productId": "2", "quantity": 150, "warehouse": "East"},
    {"productId": "3", "quantity": 200, "warehouse": "Central"}
  ]
}
"@
        Set-Content -Path "mock-data\inventory.json" -Value $inventoryJson
        Write-Success "Mock data files created"
    }
    
    # Create infrastructure directory structure
    Write-Step "Creating infrastructure directory..."
    if (-not (Test-Path "infrastructure\bicep")) {
        New-Item -ItemType Directory -Path "infrastructure\bicep" -Force | Out-Null
        Write-Success "Infrastructure directory created"
    }
    
    # Create backend functions directory structure
    Write-Step "Creating backend function directories..."
    $functionDirs = @(
        "backend\functions\ProcessImage",
        "backend\functions\GenerateDesign",
        "backend\functions\GetPricing",
        "backend\functions\shop\GetProducts",
        "backend\functions\shop\SearchProducts",
        "backend\functions\shop\GetInventory",
        "backend\functions\payments\CreateCheckout",
        "backend\functions\payments\VerifyPayment",
        "backend\functions\payments\ManageSubscription",
        "backend\shared"
    )
    
    foreach ($dir in $functionDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    Write-Success "Backend function directories created"
    
    # Create frontend directory structure
    Write-Step "Creating frontend directories..."
    $frontendDirs = @(
        "frontend\src\components\Camera",
        "frontend\src\components\ImageEditor",
        "frontend\src\components\DesignGallery",
        "frontend\src\components\PricingEstimator",
        "frontend\src\components\PaymentModal",
        "frontend\src\screens",
        "frontend\src\services"
    )
    
    foreach ($dir in $frontendDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    Write-Success "Frontend directories created"
    
    # Create GitHub workflows directory
    Write-Step "Creating GitHub workflows directory..."
    if (-not (Test-Path ".github\workflows")) {
        New-Item -ItemType Directory -Path ".github\workflows" -Force | Out-Null
        Write-Success "GitHub workflows directory created"
    }
}

Write-Host "`n"
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Update API keys in backend\.env and frontend\.env" -ForegroundColor White
Write-Host "   - Anthropic API: https://console.anthropic.com/" -ForegroundColor Gray
Write-Host "   - Stripe keys: https://dashboard.stripe.com/apikeys" -ForegroundColor Gray
Write-Host "2. Install Stripe CLI for webhook testing:" -ForegroundColor White
Write-Host "   - Windows: scoop install stripe" -ForegroundColor Gray
Write-Host "   - Login: stripe login" -ForegroundColor Gray
Write-Host "3. Start developing:" -ForegroundColor White
Write-Host "   - Frontend: cd frontend && npm start" -ForegroundColor Gray
Write-Host "   - Backend: cd backend && func start" -ForegroundColor Gray
Write-Host "4. Configure GitHub secrets for CI/CD" -ForegroundColor White
Write-Host "5. Review mock data in mock-data\ directory" -ForegroundColor White
Write-Host "`n"
