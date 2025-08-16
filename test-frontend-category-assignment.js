const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFrontendCategoryAssignment() {
  console.log('🧪 Testing exact frontend category assignment flow...\n');
  
  try {
    // Get a knowledge item and category (like frontend would)
    const item = await prisma.knowledgeItem.findFirst({
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeCategory: true
          }
        }
      }
    });
    
    const categories = await prisma.knowledgeCategory.findMany();
    
    if (!item) {
      console.log('❌ No knowledge items found');
      return;
    }
    
    console.log('📚 Using knowledge item:', {
      id: item.id,
      title: item.title,
      currentCategories: item.KnowledgeItemCategory.map(kic => kic.KnowledgeCategory.name)
    });
    
    // Pick a category to assign (like frontend would)
    const categoryToAssign = categories.find(c => 
      !item.KnowledgeItemCategory.some(kic => kic.KnowledgeCategory.id === c.id)
    );
    
    if (!categoryToAssign) {
      console.log('❌ No unassigned categories found');
      return;
    }
    
    console.log('🎯 Assigning category:', categoryToAssign.name, '(ID:', categoryToAssign.id, ')');
    
    // Simulate the exact API call the frontend makes
    const payload = {
      knowledgeItemId: item.id,
      categoryIds: [categoryToAssign.id]
    };
    
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    
    // Test the same validation logic as the API
    console.log('\n🔍 Testing API validation logic:');
    
    // 1. Verify knowledge item exists
    const knowledgeItem = await prisma.knowledgeItem.findUnique({
      where: { id: payload.knowledgeItemId }
    });
    
    if (!knowledgeItem) {
      console.log('❌ Knowledge item not found');
      return;
    }
    console.log('✅ Knowledge item exists');
    
    // 2. Verify categories exist
    const foundCategories = await prisma.knowledgeCategory.findMany({
      where: { id: { in: payload.categoryIds } }
    });
    
    console.log('📊 Category validation:', {
      requestedCount: payload.categoryIds.length,
      foundCount: foundCategories.length,
      requestedIds: payload.categoryIds,
      foundIds: foundCategories.map(cat => cat.id)
    });
    
    if (foundCategories.length !== payload.categoryIds.length) {
      console.log('❌ Some categories do not exist');
      const missing = payload.categoryIds.filter(id => !foundCategories.find(cat => cat.id === id));
      console.log('Missing categories:', missing);
      return;
    }
    console.log('✅ All categories exist');
    
    // 3. Remove existing assignments
    const deletedCount = await prisma.knowledgeItemCategory.deleteMany({
      where: { knowledgeItemId: payload.knowledgeItemId }
    });
    console.log('🗑️ Deleted existing assignments:', deletedCount.count);
    
    // 4. Create new assignments
    const assignments = payload.categoryIds.map((categoryId) => ({
      id: `${payload.knowledgeItemId}_${categoryId}`,
      knowledgeItemId: payload.knowledgeItemId,
      knowledgeCategoryId: categoryId,
    }));
    
    const created = await prisma.knowledgeItemCategory.createMany({
      data: assignments,
    });
    
    console.log('✅ Created new assignments:', created.count);
    
    // Verify the result
    const updatedItem = await prisma.knowledgeItem.findUnique({
      where: { id: payload.knowledgeItemId },
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeCategory: true
          }
        }
      }
    });
    
    console.log('\n🎉 Final result:', {
      itemId: updatedItem.id,
      assignedCategories: updatedItem.KnowledgeItemCategory.map(kic => kic.KnowledgeCategory.name)
    });
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendCategoryAssignment().catch(console.error);
