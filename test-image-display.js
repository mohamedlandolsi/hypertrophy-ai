/**
 * Test script to verify image display in user chat bubbles
 * This test verifies that when a user sends an image, it appears in their chat bubble
 */

const { chromium } = require('playwright');

async function testImageDisplay() {
  console.log('🧪 Testing image display in user chat bubbles...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to chat page
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Navigated to chat page');
    
    // Wait for chat interface to load
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
    
    // Create a test image file
    const testImagePath = require('path').join(__dirname, 'test-image.png');
    const fs = require('fs');
    
    // Create a simple base64 image if test image doesn't exist
    if (!fs.existsSync(testImagePath)) {
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      fs.writeFileSync(testImagePath, Buffer.from(base64Image, 'base64'));
    }
    
    // Click on image upload button
    await page.click('[data-testid="image-upload-button"]');
    console.log('✅ Clicked image upload button');
    
    // Upload the test image
    await page.setInputFiles('input[type="file"]', testImagePath);
    await page.waitForTimeout(1000);
    
    console.log('✅ Uploaded test image');
    
    // Check if image preview appears
    const imagePreview = await page.locator('[data-testid="image-preview"]');
    if (await imagePreview.isVisible()) {
      console.log('✅ Image preview is visible');
    } else {
      console.log('❌ Image preview is not visible');
    }
    
    // Add some text to go with the image
    await page.fill('[data-testid="chat-input"]', 'Here is a test image');
    
    // Send the message
    await page.click('[data-testid="send-button"]');
    console.log('✅ Sent message with image');
    
    // Wait for the message to appear in chat
    await page.waitForSelector('.message-content', { timeout: 10000 });
    
    // Check if the image appears in the user's chat bubble
    const userMessages = await page.locator('[data-role="user"]');
    const lastUserMessage = userMessages.last();
    
    // Check if the message contains an image
    const imageInMessage = await lastUserMessage.locator('img').count();
    
    if (imageInMessage > 0) {
      console.log('✅ Image is displayed in user chat bubble');
      
      // Verify image properties
      const imgElement = await lastUserMessage.locator('img').first();
      const imgSrc = await imgElement.getAttribute('src');
      const imgAlt = await imgElement.getAttribute('alt');
      
      if (imgSrc && imgSrc.startsWith('data:image')) {
        console.log('✅ Image has correct base64 data URL');
      } else {
        console.log('❌ Image does not have correct data URL');
      }
      
      if (imgAlt === 'Uploaded image') {
        console.log('✅ Image has correct alt text');
      } else {
        console.log('❌ Image does not have correct alt text');
      }
      
    } else {
      console.log('❌ Image is NOT displayed in user chat bubble');
    }
    
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    console.log('🎉 Image display test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testImageDisplay().catch(console.error);
