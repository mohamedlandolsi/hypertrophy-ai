const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function searchDatabaseReference() {
  try {
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!aiConfig) {
      console.log('❌ AI Configuration not found');
      return;
    }
    
    // Find where "database" appears
    const systemPrompt = aiConfig.systemPrompt;
    const databaseIndex = systemPrompt.indexOf('database');
    
    if (databaseIndex === -1) {
      console.log('✅ No database references found!');
    } else {
      console.log('❌ Found "database" at index:', databaseIndex);
      // Show context around the database reference
      const start = Math.max(0, databaseIndex - 100);
      const end = Math.min(systemPrompt.length, databaseIndex + 100);
      console.log('Context:');
      console.log('...' + systemPrompt.substring(start, end) + '...');
    }
    
    // Also check for "Database" (capitalized)
    const DatabaseIndex = systemPrompt.indexOf('Database');
    if (DatabaseIndex !== -1) {
      console.log('❌ Found "Database" at index:', DatabaseIndex);
      const start = Math.max(0, DatabaseIndex - 100);
      const end = Math.min(systemPrompt.length, DatabaseIndex + 100);
      console.log('Context:');
      console.log('...' + systemPrompt.substring(start, end) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchDatabaseReference();
