const { PrismaClient } = require('@prisma/client');

async function testCategoryAssignment() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing category assignment API flow...\n');
    
    // Get a sample knowledge item
    const knowledgeItem = await prisma.knowledgeItem.findFirst({
      select: { id: true, title: true }
    });
    
    if (!knowledgeItem) {
      console.log('❌ No knowledge items found');
      return;
    }
    
    console.log('📄 Testing with knowledge item:', {
      id: knowledgeItem.id,
      title: knowledgeItem.title
    });
    
    // Get some categories to test with
    const categories = await prisma.knowledgeCategory.findMany({
      take: 2,
      select: { id: true, name: true }
    });
    
    if (categories.length === 0) {
      console.log('❌ No categories found');
      return;
    }
    
    console.log('🏷️ Testing with categories:', categories);
    
    const categoryIds = categories.map(cat => cat.id);
    
    console.log('🚀 Making API request to test category assignment...');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/admin/knowledge-item-categories', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Note: This will fail auth, but we can see the response structure
      },
      body: JSON.stringify({
        knowledgeItemId: knowledgeItem.id,
        categoryIds: categoryIds
      })
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📄 Raw response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('📄 Parsed JSON:', json);
    } catch (e) {
      console.log('❌ Failed to parse as JSON:', e.message);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoryAssignment();
