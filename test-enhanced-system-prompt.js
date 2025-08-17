// Test script to verify enhanced system prompt features
const { PrismaClient } = require('@prisma/client');

async function testEnhancedSystemPrompt() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎯 TESTING ENHANCED SYSTEM PROMPT FEATURES');
    console.log('============================================\n');
    
    // Get the current AI configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('✅ AI Configuration found');
    console.log(`📏 System prompt length: ${config.systemPrompt.length} characters\n`);
    
    // Check for enhanced features
    const enhancedFeatures = [
      { name: 'Mandatory Exercise Laws', keywords: ['MANDATORY EXERCISE LAWS', 'Leg Extension Requirement', 'Avoid Exercise Redundancy'] },
      { name: 'Myth Detection & Correction', keywords: ['MYTH DETECTION', 'mind-muscle connection', 'myths and misconceptions'] },
      { name: 'Workout Formatting Requirements', keywords: ['WORKOUT FORMATTING', 'Use Tables', 'Table Structure'] },
      { name: 'Enhanced Response Protocol', keywords: ['Machine Priority', 'Evidence-Based Language'] }
    ];
    
    console.log('🔍 Checking for enhanced features:');
    enhancedFeatures.forEach(feature => {
      const hasFeature = feature.keywords.some(keyword => 
        config.systemPrompt.toLowerCase().includes(keyword.toLowerCase())
      );
      console.log(`   ${hasFeature ? '✅' : '❌'} ${feature.name}`);
      
      if (hasFeature) {
        const matchedKeywords = feature.keywords.filter(keyword => 
          config.systemPrompt.toLowerCase().includes(keyword.toLowerCase())
        );
        console.log(`      Keywords found: ${matchedKeywords.join(', ')}`);
      }
    });
    
    // Check specific requirements
    console.log('\n🎯 Specific Requirement Checks:');
    
    const requirements = [
      { name: 'Leg extension mandatory', check: config.systemPrompt.toLowerCase().includes('leg extension') && config.systemPrompt.toLowerCase().includes('must') },
      { name: 'Avoid squat redundancy', check: config.systemPrompt.toLowerCase().includes('squat variation') && config.systemPrompt.toLowerCase().includes('single session') },
      { name: 'Table formatting required', check: config.systemPrompt.toLowerCase().includes('table') && config.systemPrompt.toLowerCase().includes('markdown') },
      { name: 'Myth detection active', check: config.systemPrompt.toLowerCase().includes('myth') && config.systemPrompt.toLowerCase().includes('actively') },
      { name: 'Machine priority stated', check: config.systemPrompt.toLowerCase().includes('machine') && config.systemPrompt.toLowerCase().includes('priority') }
    ];
    
    let passedRequirements = 0;
    requirements.forEach(req => {
      const passed = req.check;
      console.log(`   ${passed ? '✅' : '❌'} ${req.name}`);
      if (passed) passedRequirements++;
    });
    
    console.log(`\n📊 Enhancement Score: ${passedRequirements}/${requirements.length}`);
    
    if (passedRequirements === requirements.length) {
      console.log('🎉 EXCELLENT: All enhanced features implemented successfully!');
    } else if (passedRequirements >= requirements.length * 0.8) {
      console.log('👍 GOOD: Most enhanced features implemented');
    } else {
      console.log('⚠️  NEEDS IMPROVEMENT: Several features missing');
    }
    
    // Show a sample of the enhanced sections
    console.log('\n📝 Sample Enhanced Sections:');
    const sections = config.systemPrompt.split('#').filter(section => section.trim());
    sections.forEach((section, index) => {
      const title = section.split('\n')[0].trim();
      if (title.includes('MANDATORY') || title.includes('MYTH') || title.includes('FORMATTING')) {
        console.log(`\n## ${title}`);
        console.log(section.substring(0, 200) + '...');
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing enhanced system prompt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedSystemPrompt();
