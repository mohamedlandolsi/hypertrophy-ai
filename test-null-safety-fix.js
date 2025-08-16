#!/usr/bin/env node
/**
 * Test script to verify that our null safety fixes resolve the runtime error
 * "Cannot read properties of undefined (reading 'replace')"
 */

const { isArabicText, getTextDirection, getTextFormatting, formatBidirectionalText } = require('./src/lib/text-formatting.ts');

console.log('🧪 Testing null safety fixes for text formatting functions...\n');

// Test cases that would previously cause runtime errors
const testCases = [
  { name: 'undefined', value: undefined },
  { name: 'null', value: null },
  { name: 'empty string', value: '' },
  { name: 'normal text', value: 'Hello world' },
  { name: 'Arabic text', value: 'مرحبا بك' },
];

let allTestsPassed = true;

testCases.forEach(({ name, value }) => {
  console.log(`Testing with ${name}: ${JSON.stringify(value)}`);
  
  try {
    // Test isArabicText
    const isArabic = isArabicText(value);
    console.log(`  ✅ isArabicText: ${isArabic}`);
    
    // Test getTextDirection
    const direction = getTextDirection(value);
    console.log(`  ✅ getTextDirection: ${direction}`);
    
    // Test getTextFormatting
    const formatting = getTextFormatting(value);
    console.log(`  ✅ getTextFormatting: ${JSON.stringify(formatting)}`);
    
    // Test formatBidirectionalText
    const formatted = formatBidirectionalText(value);
    console.log(`  ✅ formatBidirectionalText: ${JSON.stringify(formatted)}`);
    
    console.log('');
  } catch (error) {
    console.error(`  ❌ Error with ${name}: ${error.message}`);
    allTestsPassed = false;
  }
});

if (allTestsPassed) {
  console.log('🎉 All tests passed! The null safety fixes are working correctly.');
  console.log('✅ The runtime error "Cannot read properties of undefined (reading \'replace\')" should be resolved.');
} else {
  console.log('❌ Some tests failed. There may still be null safety issues.');
  process.exit(1);
}

console.log('\n📋 Summary of fixes applied:');
console.log('- Added null/undefined checks to isArabicText(), getTextDirection(), getTextFormatting(), and formatBidirectionalText()');
console.log('- Updated MessageContent component to handle null/undefined content');
console.log('- Updated processMessageContent to handle null/undefined input');
console.log('- Updated all Arabic-aware components to handle null/undefined values');
console.log('- Fixed TypeScript interface to accept null/undefined content');
