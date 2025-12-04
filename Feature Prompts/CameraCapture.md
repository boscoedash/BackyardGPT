@workspace Create a complete camera capture feature for taking yard photos:

Component: frontend/src/components/Camera/YardCamera.jsx

Requirements:
- Full-screen camera preview using expo-camera
- Request camera permissions on mount
- Handle permission denied with helpful alert (link to settings)
- Large capture button at bottom center (80px diameter, rounded)
- After capture, show preview screen with captured image
- Preview screen has two buttons: "Retake" and "Use Photo"
- Compress captured image to max 1024px width, 0.8 quality, JPEG format
- Return compressed image as base64 string via onCapture callback
- Handle errors: camera unavailable, compression failed
- Use react-native-paper for buttons and text
- Add loading spinner during compression
- Support both iOS and Android

Props:
- onCapture: (imageBase64: string) => void
- onCancel: () => void

Include:
- PropTypes validation
- Proper error handling with try-catch
- User-friendly error messages
- Loading states
- Accessibility labels

Also create a basic screen to test it:
frontend/src/screens/CameraScreen.jsx