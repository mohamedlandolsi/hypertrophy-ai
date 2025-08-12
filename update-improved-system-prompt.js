const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function updateSystemPromptToImproved() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📝 Updating System Prompt with Improved Version...\n');
    
    // Read the improved system prompt
    const improvedPrompt = fs.readFileSync('./IMPROVED_SYSTEM_PROMPT.md', 'utf8');
    
    console.log('📊 Current system prompt length:', (await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: { systemPrompt: true }
    }))?.systemPrompt.length || 0, 'characters');
    
    console.log('📊 New system prompt length:', improvedPrompt.length, 'characters\n');
    
    const apply = process.argv.includes('--apply');
    
    if (apply) {
      console.log('🚀 Applying improved system prompt...');
      
      await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: {
          systemPrompt: improvedPrompt
        }
      });
      
      console.log('✅ System prompt updated successfully!');
      console.log('💡 Key improvements applied:');
      console.log('  • Removed overly restrictive KB-only enforcement');
      console.log('  • Added intelligent fallback guidance');
      console.log('  • Improved synthesis and adaptation instructions');
      console.log('  • Enhanced transparency and citation standards');
      console.log('  • Better handling of knowledge gaps');
    } else {
      console.log('🔍 This is a preview. The improved prompt focuses on:');
      console.log('  • KB-Enhanced Intelligence (not KB-Only restriction)');
      console.log('  • Intelligent synthesis of KB + expert knowledge');  
      console.log('  • Better handling of programming gaps');
      console.log('  • Clearer citation and transparency standards');
      console.log('  • More practical and user-friendly approach\n');
      
      console.log('💡 Run with --apply to implement:');
      console.log('   node update-improved-system-prompt.js --apply');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateSystemPromptToImproved();
