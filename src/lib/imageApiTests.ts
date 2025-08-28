/**
 * Test utilities for the Image API service
 * Run these tests in the browser console to verify integration
 */

import { imageApiService } from './imageApi';

// Test authentication check
export const testAuthCheck = () => {
  const token = localStorage.getItem('access_token');
  console.log('🔑 Auth Test:', {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
  });
  return !!token;
};

// Test image list endpoint
export const testListImages = async () => {
  try {
    console.log('📋 Testing image list...');
    const result = await imageApiService.listImages(1, 10);
    console.log('✅ List Images Success:', result);
    return result;
  } catch (error) {
    console.error('❌ List Images Failed:', error);
    throw error;
  }
};

// Test image upload with a small test image
export const testImageUpload = async (file: File) => {
  try {
    console.log('📸 Testing image upload...');
    const result = await imageApiService.uploadImage(file, (progress) => {
      console.log(`📊 Upload Progress: ${progress.percentage}%`);
    });
    console.log('✅ Upload Success:', result);
    console.log('📊 Extracted Metadata:', result.metadata);
    return result;
  } catch (error) {
    console.error('❌ Upload Failed:', error);
    throw error;
  }
};

// Test image deletion
export const testImageDelete = async (imageId: string) => {
  try {
    console.log('🗑️ Testing image deletion...');
    await imageApiService.deleteImage(imageId);
    console.log('✅ Delete Success');
    return true;
  } catch (error) {
    console.error('❌ Delete Failed:', error);
    throw error;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🧪 Starting Image API Tests...');
  
  // Check auth
  if (!testAuthCheck()) {
    console.error('❌ No authentication token found. Please log in first.');
    return;
  }
  
  try {
    // Test listing
    const imageList = await testListImages();
    
    console.log('🧪 All tests completed successfully!');
    return imageList;
  } catch (error) {
    console.error('🧪 Tests failed:', error);
    throw error;
  }
};

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).imageApiTests = {
    testAuthCheck,
    testListImages,
    testImageUpload,
    testImageDelete,
    runAllTests
  };
  
  console.log('🧪 Image API tests loaded! Use window.imageApiTests to run tests.');
}
