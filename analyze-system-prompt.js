const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeSystemPrompt() {
  console.log('📝 Analyzing Current System Prompt for Synthesis Issues');
  console.log('====================================================\n');

  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI Configuration found!');
      return;
    }

    const prompt = config.systemPrompt;
    console.log(`📊 System Prompt Length: ${prompt.length} characters\n`);

    // Look for problematic language that might be causing over-strict behavior
    const problematicPhrases = [
      'exclusively using',
      'only if',
      'unequivocally absent',
      'exclusively grounded',
      'MUST first attempt to answer the query exclusively',
      'insufficient information',
      'lacking specific details'
    ];

    console.log('🔍 Checking for overly strict language...\n');
    
    problematicPhrases.forEach(phrase => {
      if (prompt.toLowerCase().includes(phrase.toLowerCase())) {
        console.log(`❌ Found restrictive phrase: "${phrase}"`);
        
        // Show context around the phrase
        const index = prompt.toLowerCase().indexOf(phrase.toLowerCase());
        const context = prompt.substring(Math.max(0, index - 100), index + phrase.length + 100);
        console.log(`   Context: "...${context}..."\n`);
      }
    });

    // Look for synthesis-friendly language
    const synthesisKeywords = [
      'synthesize',
      'combine',
      'integrate',
      'connect',
      'comprehensive',
      'drawing from multiple sources'
    ];

    console.log('🔍 Checking for synthesis-encouraging language...\n');
    
    let foundSynthesis = false;
    synthesisKeywords.forEach(keyword => {
      if (prompt.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`✅ Found synthesis keyword: "${keyword}"`);
        foundSynthesis = true;
      }
    });

    if (!foundSynthesis) {
      console.log('❌ No synthesis-encouraging language found\n');
    }

    // Check for the specific phrases that might be causing the issue
    console.log('🎯 Analyzing specific constraint language...\n');
    
    if (prompt.includes('EXCLUSIVELY grounded')) {
      console.log('🚨 ISSUE FOUND: "EXCLUSIVELY grounded" may be too restrictive');
    }
    
    if (prompt.includes('exclusively using the SCIENTIFIC REFERENCE MATERIAL')) {
      console.log('🚨 ISSUE FOUND: "exclusively using" prevents synthesis');
    }

    if (prompt.includes('unequivocally absent')) {
      console.log('🚨 ISSUE FOUND: "unequivocally absent" sets too high a bar');
    }

    // Show the key sections that might need modification
    console.log('\n📋 Key Sections for Review:\n');
    
    const sections = prompt.split('\n\n');
    sections.forEach((section, index) => {
      if (section.toLowerCase().includes('knowledge') || 
          section.toLowerCase().includes('reference') ||
          section.toLowerCase().includes('exclusively')) {
        console.log(`Section ${index + 1}:`);
        console.log(`"${section.substring(0, 200)}..."\n`);
      }
    });

    console.log('💡 RECOMMENDATION:');
    console.log('The system prompt may still contain overly restrictive language');
    console.log('even though AUTO mode is enabled. Consider updating the prompt to');
    console.log('explicitly encourage synthesis when users ask for complete programs.\n');

  } catch (error) {
    console.error('❌ Error analyzing system prompt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSystemPrompt();
