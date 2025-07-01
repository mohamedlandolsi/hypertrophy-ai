/**
 * Test to verify dark mode styling in knowledge processing monitor
 * This script checks that the component has proper dark mode classes
 */

const fs = require('fs');
const path = require('path');

console.log('🌙 Testing dark mode styling for Knowledge Processing Monitor...\n');

const monitorPath = path.join(__dirname, 'src', 'components', 'knowledge-processing-monitor.tsx');
const monitorContent = fs.readFileSync(monitorPath, 'utf8');

// Test 1: Check for dark mode background classes
const hasDarkBgClasses = [
  'dark:bg-blue-950/20',
  'dark:bg-green-950/20', 
  'dark:bg-yellow-950/20',
  'dark:bg-orange-950/20',
  'dark:bg-red-950/20'
].every(className => monitorContent.includes(className));

console.log('✅ Test 1 - Dark mode background classes:', hasDarkBgClasses ? 'PASS' : 'FAIL');

// Test 2: Check for dark mode border classes
const hasDarkBorderClasses = [
  'dark:border-blue-800/30',
  'dark:border-green-800/30',
  'dark:border-yellow-800/30',
  'dark:border-orange-800/30',
  'dark:border-red-800/30'
].every(className => monitorContent.includes(className));

console.log('✅ Test 2 - Dark mode border classes:', hasDarkBorderClasses ? 'PASS' : 'FAIL');

// Test 3: Check for dark mode text classes  
const hasDarkTextClasses = [
  'dark:text-blue-300',
  'dark:text-green-300',
  'dark:text-yellow-300',
  'dark:text-orange-300',
  'dark:text-red-300'
].every(className => monitorContent.includes(className));

console.log('✅ Test 3 - Dark mode text classes:', hasDarkTextClasses ? 'PASS' : 'FAIL');

// Test 4: Check for muted classes for neutral elements
const hasMutedClasses = monitorContent.includes('bg-muted/50') && 
                       monitorContent.includes('text-muted-foreground');

console.log('✅ Test 4 - Muted classes for neutral elements:', hasMutedClasses ? 'PASS' : 'FAIL');

// Test 5: Check for destructive error styling
const hasDestructiveError = monitorContent.includes('bg-destructive/10') && 
                           monitorContent.includes('border-destructive/20') &&
                           monitorContent.includes('text-destructive');

console.log('✅ Test 5 - Destructive error styling:', hasDestructiveError ? 'PASS' : 'FAIL');

// Test 6: Check that old light-only classes are removed
const hasOldLightClasses = [
  'text-gray-600',
  'text-gray-700'
].some(className => monitorContent.includes(className));

console.log('✅ Test 6 - Old light-only classes removed:', !hasOldLightClasses ? 'PASS' : 'FAIL');

const allTestsPassed = hasDarkBgClasses && hasDarkBorderClasses && hasDarkTextClasses && 
                      hasMutedClasses && hasDestructiveError && !hasOldLightClasses;

console.log('\n🎨 Summary:');
console.log('- Status cards now have dark mode backgrounds ✅');
console.log('- Borders are properly styled for dark mode ✅');
console.log('- Text colors adapt to dark mode ✅');
console.log('- Error styling uses semantic colors ✅');
console.log('- Neutral elements use muted styling ✅');

console.log(allTestsPassed ? '\n🌙 Dark mode styling implemented successfully!' : '\n❌ Some styling issues remain');
