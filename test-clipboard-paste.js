// Test file to verify clipboard paste functionality
// Run this in the browser console on the chat page

console.log('Testing clipboard paste functionality...');

// Test 1: Check if paste handlers are attached
const textarea = document.querySelector('textarea[placeholder*="Message"]');
if (textarea) {
  console.log('✓ Textarea found');
  
  // Check if onPaste is handled
  const hasOnPaste = textarea.onpaste !== null || textarea.hasAttribute('onPaste');
  console.log(`${hasOnPaste ? '✓' : '?'} Paste handler attached to textarea`);
} else {
  console.log('✗ Textarea not found');
}

// Test 2: Check if global paste listener is working
console.log('Testing global paste listener...');

// Simulate a paste event with image data
function simulatePasteWithImage() {
  // Create a test image file
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 100, 100);
  
  canvas.toBlob((blob) => {
    if (blob) {
      // Create a File object from the blob
      const file = new File([blob], 'test-image.png', { type: 'image/png' });
      
      // Create clipboard data
      const dt = new DataTransfer();
      dt.items.add(file);
      
      // Create and dispatch paste event
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true
      });
      
      // Dispatch on document to test global handler
      document.dispatchEvent(pasteEvent);
      
      console.log('✓ Paste event with image dispatched');
    }
  }, 'image/png');
}

// Test 3: Check for keyboard shortcut info
const shortcutElements = document.querySelectorAll('kbd');
let hasPasteShortcut = false;
shortcutElements.forEach(kbd => {
  if (kbd.textContent?.includes('V')) {
    hasPasteShortcut = true;
  }
});

console.log(`${hasPasteShortcut ? '✓' : '?'} Paste keyboard shortcut (⌘ V) shown in shortcuts`);

// Test 4: Check image preview functionality
const imagePreview = document.querySelector('img[alt="Selected image"]');
console.log(`${imagePreview ? '✓' : '○'} Image preview area ${imagePreview ? 'visible' : 'not visible (normal when no image)'}`);

// Test 5: Test the simulated paste
console.log('Simulating paste event with test image...');
simulatePasteWithImage();

// Instructions for manual testing
console.log('\n=== Manual Testing Instructions ===');
console.log('1. Copy an image from another application (e.g., screenshot, image from web)');
console.log('2. Click in the chat textarea or anywhere on the chat page');
console.log('3. Press Ctrl+V (Windows) or Cmd+V (Mac)');
console.log('4. You should see:');
console.log('   - A success toast: "Image pasted"');
console.log('   - Image preview above the textarea');
console.log('   - Send button becomes enabled');
console.log('5. Click send or press Enter to send the image to AI');

console.log('\nClipboard paste functionality test completed!');
