// Test file to verify image upload functionality
// Run this in the browser console on the chat page

console.log('Testing image upload functionality...');

// Test 1: Check if the image upload button exists
const imageUploadButton = document.querySelector('button[aria-label="Upload image"]');
if (imageUploadButton) {
  console.log('✓ Image upload button found');
} else {
  console.log('✗ Image upload button not found');
}

// Test 2: Check if the hidden file input exists
const fileInput = document.getElementById('image-upload');
if (fileInput) {
  console.log('✓ Hidden file input found');
  
  // Check if it accepts image files
  const acceptAttr = fileInput.getAttribute('accept');
  if (acceptAttr === 'image/*') {
    console.log('✓ File input accepts image files');
  } else {
    console.log('✗ File input does not accept image files');
  }
} else {
  console.log('✗ Hidden file input not found');
}

// Test 3: Check if the send button is updated to accept image uploads
const sendButton = document.querySelector('button[aria-label="Send message"]');
if (sendButton) {
  console.log('✓ Send button found');
  
  // Check if it's disabled when no input and no image
  if (sendButton.disabled) {
    console.log('✓ Send button is disabled when no input');
  } else {
    console.log('✗ Send button state may be incorrect');
  }
} else {
  console.log('✗ Send button not found');
}

// Test 4: Simulate clicking the image upload button
if (imageUploadButton && fileInput) {
  console.log('Testing image upload button click...');
  
  // Add event listener to see if clicking works
  imageUploadButton.addEventListener('click', () => {
    console.log('✓ Image upload button click detected');
  });
  
  // Simulate click
  imageUploadButton.click();
}

console.log('Image upload functionality test completed!');
