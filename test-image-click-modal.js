/**
 * Test script to verify image click modal functionality
 * This test verifies that when a user clicks on an image in chat, it opens in a modal dialog
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testImageClickModal() {
  console.log('🧪 Testing image click modal functionality...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Add delay for better visibility
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to chat page
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Navigated to chat page');
    
    // Wait for chat interface to load (could be chat input or guest mode)
    try {
      await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
      console.log('✅ Chat interface loaded (authenticated user)');
    } catch (error) {
      // Check if we're in guest mode
      const guestMessage = await page.locator('text=Guest Mode').isVisible();
      if (guestMessage) {
        console.log('✅ Chat interface loaded (guest mode)');
        // Look for chat input in guest mode
        await page.waitForSelector('textarea[placeholder*="message"]', { timeout: 5000 });
      } else {
        throw new Error('Chat interface not found');
      }
    }
    
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image-click.png');
    
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
    
    // Add some text to go with the image (use generic selector)
    const chatInput = await page.locator('textarea[placeholder*="message"]').first();
    await chatInput.fill('Here is a test image to verify click modal');
    
    // Send the message
    await page.click('[data-testid="send-button"]');
    console.log('✅ Sent message with image');
    
    // Wait for the message to appear in chat
    await page.waitForSelector('.message-content', { timeout: 10000 });
    
    // Find the image in the user's chat bubble
    const userMessages = await page.locator('[data-role="user"]');
    const lastUserMessage = userMessages.last();
    const imageInMessage = lastUserMessage.locator('img').first();
    
    // Verify image is present
    const isImageVisible = await imageInMessage.isVisible();
    if (isImageVisible) {
      console.log('✅ Image is visible in chat bubble');
      
      // Check if image has cursor-pointer class
      const imageClass = await imageInMessage.getAttribute('class');
      if (imageClass && imageClass.includes('cursor-pointer')) {
        console.log('✅ Image has cursor-pointer styling');
      } else {
        console.log('❌ Image missing cursor-pointer styling');
      }
      
      // Check if image has title attribute
      const imageTitle = await imageInMessage.getAttribute('title');
      if (imageTitle === 'Click to view full size') {
        console.log('✅ Image has correct title attribute');
      } else {
        console.log('❌ Image missing or incorrect title attribute');
      }
      
      // Click on the image to open modal
      await imageInMessage.click();
      console.log('✅ Clicked on image');
      
      // Wait for modal to appear
      await page.waitForTimeout(500);
      
      // Check if dialog is open
      const dialog = await page.locator('[data-slot="dialog-content"]');
      const isDialogVisible = await dialog.isVisible();
      
      if (isDialogVisible) {
        console.log('✅ Modal dialog opened successfully');
        
        // Check if larger image is displayed in modal
        const modalImage = dialog.locator('img');
        const isModalImageVisible = await modalImage.isVisible();
        
        if (isModalImageVisible) {
          console.log('✅ Large image displayed in modal');
          
          // Check if modal image has correct alt text
          const modalImageAlt = await modalImage.getAttribute('alt');
          if (modalImageAlt === 'Uploaded image - Full size') {
            console.log('✅ Modal image has correct alt text');
          } else {
            console.log('❌ Modal image has incorrect alt text:', modalImageAlt);
          }
          
          // Check if close button is present
          const closeButton = dialog.locator('[data-slot="dialog-close"]');
          const isCloseButtonVisible = await closeButton.isVisible();
          
          if (isCloseButtonVisible) {
            console.log('✅ Close button is visible in modal');
            
            // Test closing the modal
            await closeButton.click();
            await page.waitForTimeout(500);
            
            const isDialogStillVisible = await dialog.isVisible();
            if (!isDialogStillVisible) {
              console.log('✅ Modal closed successfully');
            } else {
              console.log('❌ Modal did not close');
            }
          } else {
            console.log('❌ Close button is not visible');
          }
          
        } else {
          console.log('❌ Large image not displayed in modal');
        }
        
      } else {
        console.log('❌ Modal dialog did not open');
      }
      
    } else {
      console.log('❌ Image is not visible in chat bubble');
    }
    
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    console.log('🎉 Image click modal test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testImageClickModal().catch(console.error);
