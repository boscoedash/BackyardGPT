/**
 * YardCamera Component
 * 
 * Full-screen camera component for capturing yard photos.
 * Handles permissions, image capture, compression, and preview.
 * 
 * Features:
 * - Requests camera permissions on mount
 * - Full-screen camera preview
 * - Image preview after capture
 * - Automatic image compression (1024px max width, 0.8 quality)
 * - Returns base64 JPEG string
 * 
 * @param {Function} onCapture - Callback when photo is captured and compressed (base64 string)
 * @param {Function} onCancel - Callback when user cancels
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button } from 'react-native-paper';
import PropTypes from 'prop-types';
import { IMAGE_CONSTRAINTS } from '../../constants/config';

const YardCamera = ({ onCapture, onCancel }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  /**
   * Request camera permissions
   * Shows alert with settings link if permission is denied
   */
  const requestPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to take photos of your yard. Please enable camera permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel', onPress: onCancel },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error('Permission request failed:', err);
      setError('Failed to request camera permission. Please try again.');
    }
  };

  /**
   * Handle camera ready state
   */
  const handleCameraReady = () => {
    setCameraReady(true);
  };

  /**
   * Capture photo from camera
   * Compresses image to specifications before returning
   */
  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert('Camera Not Ready', 'Please wait for the camera to initialize.');
      return;
    }

    try {
      setError(null);

      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      // Show preview immediately
      setCapturedImage(photo.uri);
    } catch (err) {
      console.error('Capture failed:', err);
      setError('Failed to capture photo. Please try again.');
      Alert.alert('Capture Failed', 'Could not take photo. Please try again.');
    }
  };

  /**
   * Compress captured image to meet size constraints
   * 
   * @param {string} imageUri - URI of the captured image
   * @returns {Promise<string>} Base64 encoded JPEG string
   */
  const compressImage = async (imageUri) => {
    try {
      setIsCompressing(true);
      setError(null);

      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: IMAGE_CONSTRAINTS.COMPRESSION_WIDTH } }],
        {
          compress: IMAGE_CONSTRAINTS.COMPRESSION_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulatedImage.base64) {
        throw new Error('Image compression failed to produce base64 output');
      }

      // Return with data URI prefix
      return `data:image/jpeg;base64,${manipulatedImage.base64}`;
    } catch (err) {
      console.error('Image compression failed:', err);
      throw new Error('Failed to process image. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  /**
   * Handle "Use Photo" button press
   * Compresses image and calls onCapture callback
   */
  const handleUsePhoto = async () => {
    if (!capturedImage) return;

    try {
      const compressedImageBase64 = await compressImage(capturedImage);
      onCapture(compressedImageBase64);
    } catch (err) {
      setError(err.message);
      Alert.alert('Processing Failed', err.message);
    }
  };

  /**
   * Handle "Retake" button press
   * Clears captured image and returns to camera view
   */
  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
  };

  // Permission loading state
  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Camera permission is required</Text>
        <Button
          mode="contained"
          onPress={requestPermissions}
          style={styles.retryButton}
          accessibilityLabel="Request camera permission again"
        >
          Request Permission
        </Button>
        <Button
          mode="text"
          onPress={onCancel}
          style={styles.cancelButton}
          accessibilityLabel="Cancel and go back"
        >
          Cancel
        </Button>
      </View>
    );
  }

  // Preview screen (after capture)
  if (capturedImage) {
    return (
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: capturedImage }}
          style={styles.previewImage}
          resizeMode="contain"
          accessibilityLabel="Preview of captured yard photo"
        />

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {isCompressing ? (
          <View style={styles.previewActions}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.compressingText}>Processing image...</Text>
          </View>
        ) : (
          <View style={styles.previewActions}>
            <Button
              mode="outlined"
              onPress={handleRetake}
              style={styles.retakeButton}
              labelStyle={styles.buttonLabel}
              disabled={isCompressing}
              accessibilityLabel="Retake photo"
            >
              Retake
            </Button>
            <Button
              mode="contained"
              onPress={handleUsePhoto}
              style={styles.usePhotoButton}
              labelStyle={styles.buttonLabel}
              disabled={isCompressing}
              accessibilityLabel="Use this photo"
            >
              Use Photo
            </Button>
          </View>
        )}
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        onCameraReady={handleCameraReady}
        accessibilityLabel="Camera viewfinder"
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.header}>
            <Button
              mode="text"
              onPress={onCancel}
              labelStyle={styles.cancelButtonLabel}
              accessibilityLabel="Cancel and go back"
            >
              Cancel
            </Button>
          </View>

          <View style={styles.captureContainer}>
            <Text style={styles.instructionText}>
              Position your yard in the frame
            </Text>
            <TouchableOpacity
              style={[
                styles.captureButton,
                !cameraReady && styles.captureButtonDisabled,
              ]}
              onPress={handleCapture}
              disabled={!cameraReady}
              accessibilityLabel="Capture photo"
              accessibilityRole="button"
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Camera>

      {!cameraReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      )}
    </View>
  );
};

YardCamera.propTypes = {
  onCapture: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  cancelButtonLabel: {
    color: '#fff',
    fontSize: 16,
  },
  captureContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 10,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  retakeButton: {
    flex: 1,
    marginRight: 10,
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  usePhotoButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#4CAF50',
  },
  buttonLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
  compressingText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 10,
  },
  errorBanner: {
    backgroundColor: '#d32f2f',
    padding: 12,
  },
  errorBannerText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default YardCamera;   