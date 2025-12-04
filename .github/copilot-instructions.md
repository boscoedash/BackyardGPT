# Landscaping AI App - GitHub Copilot Instructions

## Project Overview
Mobile-first Gen AI landscaping tool that helps users redesign their yard spaces using AI-generated designs. Users can take photos of their yard, describe preferences, and get AI-powered landscape designs with shopping recommendations from our mock retailer "Cool Yard Stuff".

## Tech Stack
- **Frontend**: React Native with Expo (iOS and Android)
- **Backend**: Azure Functions (Node.js 18+, serverless)
- **AI Services**: 
  - Azure OpenAI (GPT-4 Vision for analysis, DALL-E 3 for generation)
  - Anthropic Claude API for design planning
- **Storage**: Azure Blob Storage (images), Azure Cosmos DB (user data, designs, transactions)
- **Payments**: Stripe (subscriptions and one-time purchases)
- **Version Control**: GitHub with GitHub Actions CI/CD
- **Deployment**: Azure (Functions, Storage, Cosmos DB)

## Architecture Pattern
- RESTful API design for all Azure Functions
- Mobile-first UI with responsive design
- Serverless backend (Azure Functions)
- Component-based React Native architecture
- Context API for global state (user, cart, subscription)
- Separation of concerns: UI components, business logic, API services

## Business Model - Freemium
### Free Tier
- 3 AI-generated designs per month (resets 1st of month)
- Basic yard analysis
- Access to Cool Yard Stuff catalog
- Save up to 5 designs
- Standard resolution (1024x1024)

### Premium Tier ($9.99/month or $99/year)
- Unlimited AI-generated designs
- Advanced analysis with measurements
- Priority processing
- Unlimited saved designs
- High resolution (1792x1024)
- Design revision history
- PDF export

### Credit Packs (Pay-as-you-go)
- 10 designs: $4.99
- 25 designs: $9.99
- 50 designs: $14.99

### Cool Yard Stuff Shop
- Mock retailer with landscaping products
- AI recommendations based on designs
- Integrated checkout via Stripe

## Code Style Guidelines

### General Principles
- Write clean, readable, self-documenting code
- Prefer simplicity over cleverness
- Comment complex logic, not obvious code
- Use descriptive names over abbreviations

### JavaScript/React Style
```javascript
// ✅ GOOD - Use async/await
const generateDesign = async (imageUrl) => {
  try {
    const response = await api.post('/GenerateDesign', { imageUrl });
    return response.data;
  } catch (error) {
    console.error('Design generation failed:', error);
    throw new Error('Failed to generate design. Please try again.');
  }
};

// ❌ AVOID - .then() chains
api.post('/GenerateDesign', { imageUrl })
  .then(response => response.data)
  .catch(error => console.error(error));

// ✅ GOOD - Functional components with hooks
const YardCamera = ({ onCapture, onCancel }) => {
  const [hasPermission, setHasPermission] = useState(null);
  
  useEffect(() => {
    requestPermissions();
  }, []);
  
  return <View>...</View>;
};

// ❌ AVOID - Class components
class YardCamera extends React.Component { ... }

// ✅ GOOD - Descriptive variable names
const compressedImageBase64 = await compressImage(originalImage);
const isSubscriptionActive = user.subscriptionStatus === 'active';

// ❌ AVOID - Single letter variables (except loop counters)
const img = await compress(orig);
const x = user.status === 'active';

// ✅ GOOD - Constants for magic numbers
const FREE_TIER_LIMIT = 3;
const MAX_IMAGE_SIZE_MB = 10;
const COMPRESSION_QUALITY = 0.8;

if (user.designCount >= FREE_TIER_LIMIT) {
  showUpgradePrompt();
}

// ❌ AVOID - Magic numbers
if (user.designCount >= 3) { ... }
```

### Error Handling Pattern
```javascript
// ✅ ALWAYS use try-catch for async operations
const handleUpload = async (image) => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await uploadImage(image);
    return result;
    
  } catch (error) {
    // Log for debugging
    console.error('Upload failed:', error);
    
    // Show user-friendly messages
    if (error.response?.status === 429) {
      setError('Too many requests. Please wait a moment.');
    } else if (error.response?.status === 413) {
      setError('Image is too large. Please choose a smaller image.');
    } else {
      setError('Upload failed. Please check your connection and try again.');
    }
    
    throw error;
  } finally {
    setLoading(false);
  }
};

// ✅ ALWAYS handle errors in Azure Functions
app.http('FunctionName', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      // Function logic
      return { status: 200, jsonBody: { success: true } };
    } catch (error) {
      context.log.error('Function failed:', error);
      return {
        status: 500,
        jsonBody: {
          error: 'Operation failed',
          message: error.message
        }
      };
    }
  }
});
```

### React Native Specific
```javascript
// ✅ Use FlatList for long lists (not ScrollView)
<FlatList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  keyExtractor={item => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
/>

// ✅ Always compress images before upload
const compressedImage = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 1024 } }],
  { compress: 0.8, format: SaveFormat.JPEG }
);

// ✅ Check network connectivity before API calls
import NetInfo from '@react-native-community/netinfo';

const state = await NetInfo.fetch();
if (!state.isConnected) {
  Alert.alert('No Connection', 'Please check your internet connection');
  return;
}
```

### Documentation Style
```javascript
/**
 * Generates an AI-powered landscape design from a yard photo.
 * 
 * @param {string} imageUrl - URL of the uploaded yard image
 * @param {Object} preferences - User design preferences
 * @param {string} preferences.style - Design style (modern, traditional, native, etc.)
 * @param {string[]} preferences.plants - Preferred plant types
 * @param {string} userId - User ID for quota tracking
 * 
 * @returns {Promise<Object>} Design object with visualization and materials
 * @returns {string} return.designId - Unique design identifier
 * @returns {string} return.visualizationUrl - URL of generated design image
 * @returns {Object} return.designPlan - Detailed plan with plants and materials
 * @returns {Object} return.pricing - Cost estimates
 * 
 * @throws {Error} If user has exceeded quota
 * @throws {Error} If AI generation fails
 * 
 * @example
 * const design = await generateDesign(
 *   'https://storage.../yard.jpg',
 *   { style: 'modern', plants: ['native', 'drought-tolerant'] },
 *   'user_123'
 * );
 */
```

## File Structure
```
landscaping-ai/
├── .github/
│   ├── copilot-instructions.md (this file)
│   └── workflows/
│       ├── frontend-deploy.yml
│       └── backend-deploy.yml
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── Camera/
│   │   │   ├── ProductCard/
│   │   │   ├── DesignGallery/
│   │   │   └── PaymentModal/
│   │   ├── screens/         # Full-page screens
│   │   │   ├── HomeScreen.js
│   │   │   ├── ShopScreen.js
│   │   │   └── SubscriptionScreen.js
│   │   ├── services/        # API clients
│   │   │   ├── api.js
│   │   │   ├── shopService.js
│   │   │   └── paymentService.js
│   │   ├── contexts/        # React Context for global state
│   │   │   ├── UserContext.js
│   │   │   └── CartContext.js
│   │   ├── utils/           # Helper functions
│   │   │   ├── imageProcessing.js
│   │   │   └── formatters.js
│   │   ├── constants/       # App constants
│   │   │   └── config.js
│   │   └── App.js
│   ├── package.json
│   └── app.json
├── backend/
│   ├── functions/
│   │   ├── ProcessImage/
│   │   ├── GenerateDesign/
│   │   ├── shop/
│   │   │   ├── GetProducts/
│   │   │   └── SearchProducts/
│   │   └── payments/
│   │       ├── CreateCheckout/
│   │       ├── StripeWebhook/
│   │       └── GetSubscriptionStatus/
│   ├── shared/
│   │   ├── azure-ai.js
│   │   ├── anthropic-client.js
│   │   ├── shopData.js
│   │   └── stripe-client.js
│   ├── host.json
│   └── package.json
└── README.md
```

## Environment Variables

### Frontend (.env)
```
API_BASE_URL=https://landscaping-ai-functions.azurewebsites.net
STRIPE_PUBLISHABLE_KEY=pk_test_...
AZURE_STORAGE_ACCOUNT=landscapingaistorage
```

### Backend (Function App Settings)
```
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com
ANTHROPIC_API_KEY=sk-ant-...
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
COSMOS_DB_CONNECTION_STRING=AccountEndpoint=https://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Key Business Rules

### Usage Quotas
```javascript
// Free tier limit
const FREE_TIER_MONTHLY_LIMIT = 3;

// Reset on first of month
const isNewMonth = (lastResetDate) => {
  const now = new Date();
  const lastReset = new Date(lastResetDate);
  return now.getMonth() !== lastReset.getMonth() || 
         now.getFullYear() !== lastReset.getFullYear();
};

// Check quota before design generation
const canGenerateDesign = (user) => {
  if (user.subscriptionTier === 'premium') return true;
  if (user.creditsRemaining > 0) return true;
  if (user.subscriptionTier === 'free') {
    return user.designsThisMonth < FREE_TIER_MONTHLY_LIMIT;
  }
  return false;
};
```

### Pricing Constants
```javascript
const PRICING = {
  subscription: {
    monthly: 999,  // $9.99 in cents
    annual: 9999   // $99.99 in cents
  },
  credits: {
    pack_10: { price: 499, credits: 10 },
    pack_25: { price: 999, credits: 25 },
    pack_50: { price: 1499, credits: 50 }
  }
};
```

### Image Constraints
```javascript
const IMAGE_CONSTRAINTS = {
  MAX_SIZE_MB: 10,
  MAX_DIMENSION_PX: 4096,
  COMPRESSION_WIDTH: 1024,
  COMPRESSION_QUALITY: 0.8,
  ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'heic']
};
```

## Security Best Practices

### ✅ ALWAYS:
- Validate all user inputs on backend
- Use environment variables for secrets
- Never log sensitive data (API keys, user emails, payment info)
- Use parameterized queries for database operations
- Implement rate limiting on Azure Functions
- Verify Stripe webhook signatures

### ❌ NEVER:
- Commit API keys or secrets to Git
- Trust client-side validation alone
- Log full request/response bodies (may contain sensitive data)
- Store passwords or tokens in plain text
- Allow unlimited API calls without rate limiting

```javascript
// ✅ GOOD - Validate inputs
app.http('GenerateDesign', {
  handler: async (request, context) => {
    const { imageUrl, userId } = await request.json();
    
    if (!imageUrl || !userId) {
      return { status: 400, jsonBody: { error: 'Missing required fields' } };
    }
    
    if (!imageUrl.startsWith('https://')) {
      return { status: 400, jsonBody: { error: 'Invalid image URL' } };
    }
    
    // Proceed with generation
  }
});

// ❌ AVOID - No validation
app.http('GenerateDesign', {
  handler: async (request, context) => {
    const { imageUrl, userId } = await request.json();
    // Directly using inputs without validation
  }
});
```

## Testing Guidelines

### What to Test
- ✅ Payment processing (success, failure, cancellation)
- ✅ Usage quota enforcement
- ✅ Image upload and compression
- ✅ Design generation workflow
- ✅ Subscription state changes
- ✅ Shopping cart calculations

### Testing Example
```javascript
describe('YardCamera', () => {
  it('should request camera permissions on mount', async () => {
    const { getByTestId } = render(<YardCamera onCapture={jest.fn()} />);
    
    await waitFor(() => {
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });
  });
  
  it('should compress image before calling onCapture', async () => {
    const mockOnCapture = jest.fn();
    const { getByTestId } = render(<YardCamera onCapture={mockOnCapture} />);
    
    // Simulate capture
    fireEvent.press(getByTestId('capture-button'));
    
    await waitFor(() => {
      expect(mockOnCapture).toHaveBeenCalled();
      const capturedImage = mockOnCapture.mock.calls[0][0];
      expect(capturedImage).toMatch(/^data:image\/jpeg;base64,/);
    });
  });
});
```

## Common Patterns

### Loading States
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleAction = async () => {
  try {
    setLoading(true);
    setError(null);
    await performAction();
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

return (
  <View>
    {loading && <ActivityIndicator />}
    {error && <Text style={styles.error}>{error}</Text>}
    <Button onPress={handleAction} disabled={loading}>
      Submit
    </Button>
  </View>
);
```

### API Calls with Retry
```javascript
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Request failed: ${response.status}`);
      }
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

## Git Commit Message Format
```
<type>: <subject>

<body>

<footer>

Types: feat, fix, docs, style, refactor, test, chore
```

Examples:
```
feat: Add camera capture component

- Implements YardCamera with permission handling
- Adds image compression (1024px max width)
- Shows preview screen with retake/use options

Tested on iOS simulator and Android emulator.

---

fix: Correct subscription quota check logic

- Fixed bug where premium users were being limited
- Updated quota check to properly handle subscription status

Closes #42
```

## Performance Considerations
- Compress images before uploading (target 1024px width)
- Use FlatList instead of ScrollView for long lists
- Implement pagination for API responses (20 items per page)
- Cache API responses where appropriate (products, user data)
- Lazy load images in galleries
- Debounce search inputs (300ms delay)
- Use React.memo for expensive components

## Accessibility
- Add meaningful labels to all touchable elements
- Use proper heading hierarchy
- Ensure sufficient color contrast (WCAG AA)
- Support screen readers with accessibilityLabel
- Make touch targets at least 44x44pt

Remember: Write code as if the next person maintaining it is a violent psychopath who knows where you live. Make it clear, make it simple, make it work.