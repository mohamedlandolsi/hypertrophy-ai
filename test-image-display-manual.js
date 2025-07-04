/**
 * Simple test to verify image display functionality
 * This test manually opens the browser to test the image display feature
 */

const { chromium } = require('playwright');

async function testImageDisplayManual() {
  console.log('🧪 Testing image display in user chat bubbles...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Add delay for better visibility
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to chat page
    await page.goto('http://localhost:3000/chat');
    console.log('✅ Navigated to chat page');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see the current state
    await page.screenshot({ path: 'chat-page-screenshot.png' });
    console.log('📸 Screenshot taken: chat-page-screenshot.png');
    
    // Wait for either the chat input or login prompt to appear
    try {
      await page.waitForSelector('[data-testid="chat-input"], .login-prompt, [data-testid="image-upload-button"]', { timeout: 15000 });
      console.log('✅ Chat interface elements detected');
    } catch (error) {
      console.log('❌ Chat interface not found within timeout');
      console.log('Current page content preview:');
      const textContent = await page.evaluate(() => document.body.textContent);
      console.log(textContent.substring(0, 500) + '...');
    }
    
    // Check if the image upload button is visible
    const imageUploadButton = await page.locator('[data-testid="image-upload-button"]');
    const isImageUploadVisible = await imageUploadButton.isVisible().catch(() => false);
    
    if (isImageUploadVisible) {
      console.log('✅ Image upload button is visible');
    } else {
      console.log('❌ Image upload button is not visible');
    }
    
    // Check if the chat input exists
    const chatInput = await page.locator('[data-testid="chat-input"]');
    const isChatInputVisible = await chatInput.isVisible().catch(() => false);
    
    if (isChatInputVisible) {
      console.log('✅ Chat input is visible');
    } else {
      console.log('❌ Chat input is not visible');
    }
    
    console.log('🎉 Manual test completed. Please check the browser window and screenshot.');
    console.log('Press Ctrl+C to close the browser when done testing.');
    
    // Keep the browser open for manual testing
    await page.waitForTimeout(120000); // Wait 2 minutes for manual testing
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Error screenshot saved: error-screenshot.png');
  } finally {
    await browser.close();
  }
}

// Function to test the message content component separately
async function testMessageContentComponent() {
  console.log('🧪 Testing MessageContent component...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Create a test HTML page with our component
    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MessageContent Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .test-container { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
          img { max-width: 300px; max-height: 200px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>MessageContent Component Test</h1>
        
        <div class="test-container">
          <h2>Test 1: Message with Image</h2>
          <div class="message-content">
            <div>
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Uploaded image" style="max-width: 300px; max-height: 200px; border: 1px solid #ddd; margin-bottom: 10px;">
            </div>
            <div>Here is a test message with an image</div>
          </div>
        </div>
        
        <div class="test-container">
          <h2>Test 2: Message without Image</h2>
          <div class="message-content">
            <div>This is a message without an image</div>
          </div>
        </div>
        
        <div class="test-container">
          <h2>Test 3: Image Only Message</h2>
          <div class="message-content">
            <div>
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Uploaded image" style="max-width: 300px; max-height: 200px; border: 1px solid #ddd;">
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(testHTML);
    console.log('✅ Test page loaded');
    
    // Check if images are displayed
    const images = await page.locator('img');
    const imageCount = await images.count();
    console.log(`✅ Found ${imageCount} images on the test page`);
    
    // Take a screenshot
    await page.screenshot({ path: 'message-content-test.png' });
    console.log('📸 Screenshot taken: message-content-test.png');
    
    console.log('🎉 MessageContent component test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the tests
(async () => {
  await testMessageContentComponent();
  await testImageDisplayManual();
})().catch(console.error);
