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