/**
 * CameraScreen
 * 
 * Test screen for YardCamera component.
 * Demonstrates camera integration and image capture workflow.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Button } from 'react-native-paper';
import YardCamera from '../components/Camera/YardCamera';

const CameraScreen = ({ navigation }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  /**
   * Handle successful image capture
   * 
   * @param {string} imageBase64 - Base64 encoded JPEG image
   */
  const handleCapture = (imageBase64) => {
    console.log('Image captured, size:', imageBase64.length, 'bytes');
    setCapturedImage(imageBase64);
    setShowCamera(false);

    Alert.alert(
      'Photo Captured!',
      `Image size: ${(imageBase64.length / 1024).toFixed(2)} KB`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle camera cancel
   */
  const handleCancel = () => {
    setShowCamera(false);
  };

  /**
   * Open camera for new photo
   */
  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  /**
   * Clear captured photo
   */
  const handleClear = () => {
    setCapturedImage(null);
  };

  // Show camera view
  if (showCamera) {
    return (
      <YardCamera
        onCapture={handleCapture}
        onCancel={handleCancel}
      />
    );
  }

  // Show main screen
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Camera Test Screen</Text>
        <Text style={styles.description}>
          Test the YardCamera component by taking a photo of your yard.
          The image will be compressed to 1024px max width at 80% quality.
        </Text>

        <Button
          mode="contained"
          onPress={handleTakePhoto}
          style={styles.button}
          icon="camera"
          accessibilityLabel="Take a photo of your yard"
        >
          Take Yard Photo
        </Button>

        {capturedImage && (
          <View style={styles.previewContainer}>
            <Text style={styles.sectionTitle}>Captured Image</Text>
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <Text style={styles.imageInfo}>
              Size: {(capturedImage.length / 1024).toFixed(2)} KB
            </Text>
            <Text style={styles.imageInfo}>
              Format: JPEG (Base64 encoded)
            </Text>

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleClear}
                style={styles.clearButton}
                accessibilityLabel="Clear captured image"
              >
                Clear
              </Button>
              <Button
                mode="contained"
                onPress={handleTakePhoto}
                style={styles.retakeButtonAction}
                accessibilityLabel="Take another photo"
              >
                Take Another
              </Button>
            </View>
          </View>
        )}

        {!capturedImage && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No photo captured yet. Tap the button above to get started!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    marginVertical: 10,
    backgroundColor: '#4CAF50',
  },
  previewContainer: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  imageInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  clearButton: {
    flex: 1,
    borderColor: '#4CAF50',
  },
  retakeButtonAction: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  emptyState: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default CameraScreen;
