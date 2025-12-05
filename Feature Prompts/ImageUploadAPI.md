@workspace Create an Azure Function to upload images to Azure Blob Storage:

Function: backend/functions/UploadImage/index.js

Requirements:
- Accept POST requests with JSON body:
  {
    imageData: string (base64),
    userId: string,
    fileName?: string (optional)
  }
- Validate image data exists and is valid base64
- Check image size (max 10MB)
- Generate unique filename if not provided (userId_timestamp_randomId.jpg)
- Convert base64 to buffer
- Upload to Azure Blob Storage container "yard-images"
- Make blob publicly readable
- Return response:
  {
    imageUrl: string,
    imageId: string,
    uploadedAt: string (ISO 8601)
  }
- Error handling:
  - 400: Missing fields or invalid data
  - 413: Image too large
  - 500: Upload failed
- Use environment variable AZURE_STORAGE_CONNECTION_STRING
- Log important operations with context.log
- Include retry logic (3 attempts with exponential backoff)

Also create the function.json config file.