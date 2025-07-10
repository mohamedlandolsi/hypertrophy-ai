// Test script to verify article link functionality
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testKnowledgeArticles() {
  try {
    console.log('🧪 Testing knowledge article functionality...\n');

    // Get all knowledge items
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        content: true,
        createdAt: true,
      },
      take: 5, // Limit to first 5 items
    });

    if (knowledgeItems.length === 0) {
      console.log('❌ No knowledge items found in the database.');
      console.log('💡 Suggestion: Add some knowledge items first using the admin panel.');
    } else {
      console.log(`✅ Found ${knowledgeItems.length} knowledge items:\n`);
      
      knowledgeItems.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   Title: ${item.title}`);
        console.log(`   Type: ${item.type}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Has Content: ${item.content ? 'Yes' : 'No'}`);
        console.log(`   Created: ${item.createdAt.toLocaleDateString()}`);
        console.log(`   Article URL: http://localhost:3000/knowledge/${item.id}\n`);
      });

      // Show example AI response format
      console.log('📝 Example AI response with article links:');
      console.log('---');
      const firstItem = knowledgeItems[0];
      console.log(`According to the research on muscle hypertrophy, [${firstItem.title}](article:${firstItem.id}), proper nutrition is essential for optimal muscle growth.`);
      console.log('---\n');

      console.log('🎯 Test Instructions:');
      console.log('1. Start a chat conversation');
      console.log('2. Ask a question related to the knowledge base');
      console.log('3. Look for clickable article links in the AI response');
      console.log('4. Click the links to verify they open the article pages');
    }

  } catch (error) {
    console.error('❌ Error testing knowledge articles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testKnowledgeArticles();
