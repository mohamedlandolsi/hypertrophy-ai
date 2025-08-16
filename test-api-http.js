const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPIEndpoint() {
  console.log('🧪 Testing actual API endpoint...\n');
  
  try {
    // Get test data
    const item = await prisma.knowledgeItem.findFirst();
    const categories = await prisma.knowledgeCategory.findMany();
    
    if (!item || !categories.length) {
      console.log('❌ No test data available');
      return;
    }
    
    const categoryToAssign = categories[0]; // Use the first category
    
    console.log('📝 Test setup:', {
      itemId: item.id,
      itemTitle: item.title,
      categoryId: categoryToAssign.id,
      categoryName: categoryToAssign.name
    });
    
    const payload = {
      knowledgeItemId: item.id,
      categoryIds: [categoryToAssign.id]
    };
    
    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
    
    // Make the actual API request
    const response = await fetch('http://localhost:3000/api/admin/knowledge-item-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This won't have auth headers, so we'll expect a 401
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Response text (length:', responseText?.length || 0, '):', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('📊 Parsed response:', result);
    } catch (parseError) {
      console.log('❌ Failed to parse JSON:', parseError.message);
    }
    
    // Expected: 401 Unauthorized (since we don't have auth headers)
    if (response.status === 401) {
      console.log('✅ Expected 401 response - API endpoint is working correctly');
    } else {
      console.log('⚠️ Unexpected response status');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIEndpoint().catch(console.error);
