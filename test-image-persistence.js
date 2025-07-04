/**
 * Test script to verify image persistence after page refresh
 * This test checks that images are saved to and loaded from the database
 */

const { chromium } = require('playwright');

async function testImagePersistence() {
  console.log('🧪 Testing image persistence after page refresh...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to chat page
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Navigated to chat page');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if we can find the chat interface
    const chatInputExists = await page.locator('[data-testid="chat-input"]').isVisible().catch(() => false);
    const imageUploadExists = await page.locator('[data-testid="image-upload-button"]').isVisible().catch(() => false);
    
    if (!chatInputExists || !imageUploadExists) {
      console.log('❌ Chat interface not fully loaded or user not authenticated');
      console.log('This test requires an authenticated user session');
      return;
    }
    
    console.log('✅ Chat interface detected');
    
    // Create a simple test image
    const fs = require('fs');
    const testImagePath = require('path').join(__dirname, 'test-persistence-image.png');
    
    // Create a simple base64 image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      // This is a 1x1 red pixel PNG
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58BAAAFAAGiAoNxAAAAAElFTkSuQmCC';
      fs.writeFileSync(testImagePath, Buffer.from(base64Image, 'base64'));
    }
    
    // Upload the test image
    await page.locator('[data-testid="image-upload-button"]').click();
    await page.locator('input[type="file"]').setInputFiles(testImagePath);
    await page.waitForTimeout(1000);
    
    console.log('✅ Uploaded test image');
    
    // Add a text message
    await page.fill('[data-testid="chat-input"]', 'Test message with image for persistence check');
    
    // Send the message
    await page.click('[data-testid="send-button"]');
    await page.waitForTimeout(3000); // Wait for AI response
    
    console.log('✅ Sent message with image');
    
    // Check if image appears in chat
    const userMessages = await page.locator('[data-role="user"]');
    const lastUserMessage = userMessages.last();
    const imageInMessage = await lastUserMessage.locator('img').count();
    
    if (imageInMessage === 0) {
      console.log('❌ Image not found in user message before refresh');
      return;
    }
    
    console.log('✅ Image displayed in user message before refresh');
    
    // Get the current URL to preserve chat context
    const currentUrl = page.url();
    
    // Refresh the page
    console.log('🔄 Refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if image still appears after refresh
    const userMessagesAfterRefresh = await page.locator('[data-role="user"]');
    const messageCount = await userMessagesAfterRefresh.count();
    
    if (messageCount === 0) {
      console.log('❌ No messages found after refresh');
      return;
    }
    
    // Find the message with our test text
    let imageFoundAfterRefresh = false;
    for (let i = 0; i < messageCount; i++) {
      const message = userMessagesAfterRefresh.nth(i);
      const messageText = await message.textContent();
      
      if (messageText && messageText.includes('Test message with image for persistence')) {
        const imageCount = await message.locator('img').count();
        if (imageCount > 0) {
          imageFoundAfterRefresh = true;
          console.log('✅ Image found in user message after refresh!');
          break;
        }
      }
    }
    
    if (!imageFoundAfterRefresh) {
      console.log('❌ Image NOT found in user message after refresh');
      console.log('This indicates that image persistence is not working correctly');
    }
    
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    console.log('🎉 Image persistence test completed');
    
    // Keep browser open for manual verification
    console.log('Browser will remain open for 30 seconds for manual verification...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testImagePersistence().catch(console.error);
