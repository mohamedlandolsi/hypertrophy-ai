// Test file to verify chat box enhancements
// Run this in the browser console on the chat page

console.log('Testing chat box enhancements...');

// Test 1: Check if the textarea has the correct classes
const textarea = document.querySelector('textarea');
if (textarea) {
  console.log('✓ Textarea found');
  
  // Check if it has the overflow-y-auto class
  if (textarea.classList.contains('overflow-y-auto')) {
    console.log('✓ overflow-y-auto class applied');
  } else {
    console.log('✗ overflow-y-auto class not found');
  }
  
  // Check if it has the max-h-[120px] class
  if (textarea.classList.contains('max-h-[120px]')) {
    console.log('✓ max-h-[120px] class applied');
  } else {
    console.log('✗ max-h-[120px] class not found');
  }
  
  // Check if it has the chat-textarea class for custom scrollbar
  if (textarea.classList.contains('chat-textarea')) {
    console.log('✓ chat-textarea class applied');
  } else {
    console.log('✗ chat-textarea class not found');
  }
} else {
  console.log('✗ Textarea not found');
}

// Test 2: Check send button
const sendButton = document.querySelector('[aria-label="Send message"]');
if (sendButton) {
  console.log('✓ Send button found');
  
  // Check if it has disabled styling
  if (sendButton.classList.contains('disabled:opacity-40')) {
    console.log('✓ Enhanced disabled styling applied');
  } else {
    console.log('✗ Enhanced disabled styling not found');
  }
} else {
  console.log('✗ Send button not found');
}

// Test 3: Simulate typing to test auto-resize and scrolling
if (textarea) {
  console.log('Testing auto-resize and scrolling...');
  
  // Simulate typing a long message
  const longText = 'This is a test message that should be long enough to trigger the auto-resize functionality and eventually show the scrollbar when it reaches the maximum height of 120px. '.repeat(5);
  
  textarea.value = longText;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    console.log('Textarea height:', textarea.style.height);
    console.log('Textarea scrollHeight:', textarea.scrollHeight);
    console.log('Textarea clientHeight:', textarea.clientHeight);
    
    if (textarea.scrollHeight > textarea.clientHeight) {
      console.log('✓ Scrollbar should be visible');
    } else {
      console.log('✗ Scrollbar not needed yet');
    }
  }, 100);
}

console.log('Chat box enhancement test completed!');
