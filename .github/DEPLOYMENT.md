# GitHub Actions Deployment Setup

This document explains how to configure GitHub Actions to automatically deploy the Azure Functions backend.

## Required GitHub Secrets

### 1. AZURE_CREDENTIALS

Create a service principal for GitHub Actions to authenticate with Azure:

```powershell
# Create service principal with contributor access to the resource group
az ad sp create-for-rbac --name "github-actions-backyardgpt" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-backyardgpt \
  --sdk-auth
```

This command will output JSON credentials. Copy the **entire JSON output** and add it as a GitHub secret:

1. Go to your GitHub repository: `https://github.com/boscoedash/BackyardGPT`
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `AZURE_CREDENTIALS`
5. Value: Paste the entire JSON output from the command above
6. Click **Add secret**

The JSON should look like:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

## Azure Function App Configuration

Ensure your Function App has the required application settings configured:

```powershell
# Set Azure Storage connection string for blob uploads
az functionapp config appsettings set \
  --resource-group rg-backyardgpt \
  --name landscaping-ai-functions \
  --settings "AZURE_STORAGE_CONNECTION_STRING=<your-storage-connection-string>"

# Set Azure OpenAI credentials (for future AI functions)
az functionapp config appsettings set \
  --resource-group rg-backyardgpt \
  --name landscaping-ai-functions \
  --settings \
    "AZURE_OPENAI_KEY=<your-key>" \
    "AZURE_OPENAI_ENDPOINT=<your-endpoint>"

# Set Anthropic API key (for future AI functions)
az functionapp config appsettings set \
  --resource-group rg-backyardgpt \
  --name landscaping-ai-functions \
  --settings "ANTHROPIC_API_KEY=<your-key>"

# Set Cosmos DB connection (for future user data storage)
az functionapp config appsettings set \
  --resource-group rg-backyardgpt \
  --name landscaping-ai-functions \
  --settings "COSMOS_DB_CONNECTION_STRING=<your-connection-string>"

# Set Stripe credentials (for future payment functions)
az functionapp config appsettings set \
  --resource-group rg-backyardgpt \
  --name landscaping-ai-functions \
  --settings \
    "STRIPE_SECRET_KEY=<your-key>" \
    "STRIPE_WEBHOOK_SECRET=<your-webhook-secret>"
```

## Get Azure Storage Connection String

```powershell
# List storage accounts
az storage account list --resource-group rg-backyardgpt --query "[].{name:name}" -o table

# Get connection string (replace with your storage account name)
az storage account show-connection-string \
  --name landscapingaistorage \
  --resource-group rg-backyardgpt \
  --query connectionString -o tsv
```

## Workflow Triggers

The deployment workflow runs automatically when:

- **Code is pushed to `main` branch** with changes in the `backend/` folder
- **Manual trigger** via GitHub Actions UI (workflow_dispatch)

## Manual Deployment

To manually trigger deployment:

1. Go to **Actions** tab in GitHub repository
2. Select **Deploy Azure Functions Backend** workflow
3. Click **Run workflow** button
4. Select branch (usually `main`)
5. Click **Run workflow**

## Monitoring Deployments

- View deployment status in **Actions** tab
- Check Azure Function App logs:
  ```powershell
  az functionapp logs --resource-group rg-backyardgpt --name landscaping-ai-functions
  ```
- View function URLs:
  ```powershell
  az functionapp function show \
    --resource-group rg-backyardgpt \
    --name landscaping-ai-functions \
    --function-name UploadImage \
    --query "invokeUrlTemplate" -o tsv
  ```

## Troubleshooting

### Deployment fails with "NotFound" error
- Wait 30-60 seconds for Azure to sync the function
- Verify the function app exists: `az functionapp list -g rg-backyardgpt -o table`

### Authentication errors
- Verify `AZURE_CREDENTIALS` secret is set correctly
- Ensure service principal has contributor role on resource group

### Function not appearing after deployment
- Functions may take a few minutes to sync in Azure
- Check deployment logs in Azure Portal: Function App > Deployment Center

## Security Best Practices

✅ **DO:**
- Use GitHub secrets for all credentials
- Limit service principal scope to specific resource group
- Rotate service principal credentials periodically
- Use environment protection rules for production deployments

❌ **DON'T:**
- Commit credentials to `.env` files
- Share `AZURE_CREDENTIALS` JSON outside GitHub
- Use overly permissive service principal roles
- Deploy from untrusted branches

## Next Steps

After setup:
1. Push code changes to `backend/` folder
2. Watch the Actions tab for deployment status
3. Verify functions are accessible via their URLs
4. Update frontend `.env` with production function URLs
