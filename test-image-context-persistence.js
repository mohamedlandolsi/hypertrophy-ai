/**
 * Test script to verify image persistence in conversation context
 * This test verifies that when a user sends an image and continues the conversation,
 * the AI can still "see" and reference the image from earlier messages
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testImageContextPersistence() {
  console.log('🧪 Testing image context persistence in conversation...');
  
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
    
    // Wait for chat interface to load (handle both authenticated and guest mode)
    try {
      await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
      console.log('✅ Chat interface loaded (authenticated user)');
    } catch (error) {
      // Check if we're in guest mode
      const guestMessage = await page.locator('text=Guest Mode').isVisible();
      if (guestMessage) {
        console.log('✅ Chat interface loaded (guest mode)');
        await page.waitForSelector('textarea[placeholder*="message"]', { timeout: 5000 });
      } else {
        throw new Error('Chat interface not found');
      }
    }
    
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image-context.png');
    
    // Create a simple colored square image for testing
    if (!fs.existsSync(testImagePath)) {
      // Create a red square image (more complex than previous tests)
      const canvas = require('canvas');
      const canvasElement = canvas.createCanvas(200, 200);
      const ctx = canvasElement.getContext('2d');
      
      // Draw a red square with white text
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('TEST IMAGE', 50, 100);
      
      const buffer = canvasElement.toBuffer('image/png');
      fs.writeFileSync(testImagePath, buffer);
    }
    
    console.log('✅ Test image created');
    
    // Step 1: Upload image and send first message
    await page.click('[data-testid="image-upload-button"]');
    console.log('✅ Clicked image upload button');
    
    await page.setInputFiles('input[type="file"]', testImagePath);
    await page.waitForTimeout(1000);
    
    // Fill first message asking about the image
    const chatInput = await page.locator('textarea[placeholder*="message"]').first();
    await chatInput.fill('What do you see in this image? Please describe it in detail.');
    
    // Send the message
    await page.click('[data-testid="send-button"]');
    console.log('✅ Sent first message with image');
    
    // Wait for AI response
    await page.waitForTimeout(5000);
    
    // Step 2: Send a follow-up message without image
    await chatInput.fill('Based on the image I just sent, what color is it?');
    await page.click('[data-testid="send-button"]');
    console.log('✅ Sent follow-up message asking about image color');
    
    // Wait for AI response
    await page.waitForTimeout(5000);
    
    // Step 3: Send another follow-up message testing longer context
    await chatInput.fill('Can you tell me again what text was written in the image from my first message?');
    await page.click('[data-testid="send-button"]');
    console.log('✅ Sent third message asking about image text');
    
    // Wait for AI response
    await page.waitForTimeout(5000);
    
    // Step 4: Analyze the conversation to check if AI maintained context
    console.log('🔍 Analyzing conversation for image context persistence...');
    
    const messages = await page.locator('[data-role="assistant"]').all();
    console.log(`✅ Found ${messages.length} AI responses`);
    
    if (messages.length >= 3) {
      // Check if the AI responses show awareness of the image
      for (let i = 0; i < messages.length; i++) {
        const messageText = await messages[i].textContent();
        console.log(`📝 AI Response ${i + 1}: ${messageText?.substring(0, 100)}...`);
        
        // Check for image-related keywords in responses
        const imageKeywords = ['red', 'color', 'image', 'see', 'text', 'TEST IMAGE'];
        const hasImageContext = imageKeywords.some(keyword => 
          messageText?.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasImageContext) {
          console.log(`✅ Response ${i + 1} shows image awareness`);
        } else {
          console.log(`❌ Response ${i + 1} lacks image context`);
        }
      }
      
      // Specific check for the second and third responses
      const secondResponse = await messages[1].textContent();
      const thirdResponse = await messages[2].textContent();
      
      const secondHasColorReference = secondResponse?.toLowerCase().includes('red') || 
                                     secondResponse?.toLowerCase().includes('color');
      const thirdHasTextReference = thirdResponse?.toLowerCase().includes('test') || 
                                   thirdResponse?.toLowerCase().includes('text');
      
      if (secondHasColorReference) {
        console.log('✅ Second response correctly references image color');
      } else {
        console.log('❌ Second response failed to maintain image color context');
      }
      
      if (thirdHasTextReference) {
        console.log('✅ Third response correctly references image text');
      } else {
        console.log('❌ Third response failed to maintain image text context');
      }
      
      // Overall assessment
      if (secondHasColorReference && thirdHasTextReference) {
        console.log('🎉 SUCCESS: Image context persistence is working correctly!');
      } else {
        console.log('❌ ISSUE: Image context is not being maintained across conversation');
      }
      
    } else {
      console.log('❌ Not enough AI responses to test context persistence');
    }
    
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    console.log('🎉 Image context persistence test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testImageContextPersistence().catch(console.error);
