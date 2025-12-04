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
        --runtime-version 18 `
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
HOME_DEPOT_API_KEY=your_home_depot_key_here
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
    Write-Host "2. Add your Home Depot API key to backend\.env" -ForegroundColor Yellow
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
        npm install dotenv
        
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
}

Write-Host "`n"
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Update API keys in backend\.env and frontend\.env"
Write-Host "2. Start frontend: cd frontend && npm start"
Write-Host "3. Start backend: cd backend && func start"
Write-Host "4. Configure GitHub secrets for CI/CD"
Write-Host "`n"
