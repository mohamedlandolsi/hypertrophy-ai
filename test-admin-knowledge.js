/**
 * Test to verify admin knowledge page protection
 * This script checks that:
 * 1. The knowledge page is now under /admin/knowledge
 * 2. Admin access checking is implemented
 * 3. Navigation links are updated to point to the new location
 * 4. Middleware protection is updated
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing admin knowledge page protection...\n');

// Check that the knowledge page exists in the admin folder
const adminKnowledgePath = path.join(__dirname, 'src', 'app', 'admin', 'knowledge', 'page.tsx');
const adminKnowledgeExists = fs.existsSync(adminKnowledgePath);
console.log('✅ Test 1 - Admin knowledge page exists:', adminKnowledgeExists ? 'PASS' : 'FAIL');

if (adminKnowledgeExists) {
  const adminKnowledgeContent = fs.readFileSync(adminKnowledgePath, 'utf8');
  
  // Test 2: Check for admin access verification
  const hasAdminAccessCheck = adminKnowledgeContent.includes('checkAdminAccess') && 
                             adminKnowledgeContent.includes('adminAccessError') &&
                             adminKnowledgeContent.includes('/api/admin/config');
  console.log('✅ Test 2 - Admin access verification implemented:', hasAdminAccessCheck ? 'PASS' : 'FAIL');
  
  // Test 3: Check for proper error handling
  const hasErrorHandling = adminKnowledgeContent.includes('Access denied. Admin privileges required');
  console.log('✅ Test 3 - Admin access error handling:', hasErrorHandling ? 'PASS' : 'FAIL');
  
  // Test 4: Check for router import
  const hasRouterImport = adminKnowledgeContent.includes("useRouter") && adminKnowledgeContent.includes('next/navigation');
  console.log('✅ Test 4 - Router import for redirects:', hasRouterImport ? 'PASS' : 'FAIL');
}

// Test 5: Check chat page links are updated
const chatPath = path.join(__dirname, 'src', 'app', 'chat', 'page.tsx');
if (fs.existsSync(chatPath)) {
  const chatContent = fs.readFileSync(chatPath, 'utf8');
  const hasUpdatedLinks = chatContent.includes('/admin/knowledge') && !chatContent.includes('href="/knowledge"');
  console.log('✅ Test 5 - Chat page links updated to admin route:', hasUpdatedLinks ? 'PASS' : 'FAIL');
} else {
  console.log('❌ Test 5 - Chat page not found');
}

// Test 6: Check middleware is updated
const middlewarePath = path.join(__dirname, 'src', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  const hasOldKnowledgeProtection = middlewareContent.includes('request.nextUrl.pathname.startsWith(\'/knowledge\')');
  const hasAdminProtection = middlewareContent.includes('request.nextUrl.pathname.startsWith(\'/admin\')');
  console.log('✅ Test 6 - Old knowledge route protection removed:', !hasOldKnowledgeProtection ? 'PASS' : 'FAIL');
  console.log('✅ Test 7 - Admin route protection exists:', hasAdminProtection ? 'PASS' : 'FAIL');
} else {
  console.log('❌ Test 6 & 7 - Middleware not found');
}

console.log('\n🎉 Admin knowledge page protection tests completed!');
