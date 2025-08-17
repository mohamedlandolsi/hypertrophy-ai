// Test script to verify enhanced system prompt features
const { PrismaClient } = require('@prisma/client');
const { generateChatResponse } = require('./src/lib/gemini');

async function testEnhancedFeatures() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎯 TESTING ENHANCED SYSTEM PROMPT FEATURES');
    console.log('============================================\n');
    
    // Test 1: Myth Detection
    console.log('🚫 Test 1: Myth Detection and Correction');
    console.log('Query: "How important is mind-muscle connection for hypertrophy?"');
    
    try {
      const mythResponse = await generateChatResponse(
        'test-user-123',
        [],
        'How important is mind-muscle connection for hypertrophy?'
      );
      
      const hasMythCorrection = mythResponse.content.toLowerCase().includes('myth') || 
                               mythResponse.content.toLowerCase().includes('misconception');
      console.log(`   Myth detection: ${hasMythCorrection ? '✅' : '❌'}`);
      console.log(`   Response length: ${mythResponse.content.length} chars`);
      
    } catch (error) {
      console.log('   ❌ Error testing myth detection:', error.message);
    }
    
    // Test 2: Table Formatting and Exercise Laws
    console.log('\n📊 Test 2: Table Formatting and Exercise Laws');
    console.log('Query: "Design a leg workout with proper formatting"');
    
    try {
      const tableResponse = await generateChatResponse(
        'test-user-123', 
        [],
        'Design a complete leg workout for hypertrophy with proper formatting'
      );
      
      const hasTable = tableResponse.content.includes('|') && 
                      tableResponse.content.includes('Exercise');
      const hasLegExtension = tableResponse.content.toLowerCase().includes('leg extension');
      const avoidRedundancy = !(tableResponse.content.toLowerCase().includes('leg press') && 
                               tableResponse.content.toLowerCase().includes('hack squat'));
      
      console.log(`   Table formatting: ${hasTable ? '✅' : '❌'}`);
      console.log(`   Leg extension included: ${hasLegExtension ? '✅' : '❌'}`);
      console.log(`   Avoids redundancy: ${avoidRedundancy ? '✅' : '❌'}`);
      console.log(`   Response length: ${tableResponse.content.length} chars`);
      
      if (hasTable) {
        const tableLines = tableResponse.content.split('\n').filter(line => line.includes('|'));
        console.log(`   Table rows found: ${tableLines.length}`);
      }
      
    } catch (error) {
      console.log('   ❌ Error testing table formatting:', error.message);
    }
    
    // Test 3: Knowledge Base Citation
    console.log('\n📚 Test 3: Knowledge Base Citation Quality');
    console.log('Query: "What are the best rep ranges for hypertrophy?"');
    
    try {
      const citationResponse = await generateChatResponse(
        'test-user-123',
        [],
        'What are the best rep ranges for hypertrophy and why?'
      );
      
      const hasCitations = citationResponse.citations && citationResponse.citations.length > 0;
      const hasKBReference = citationResponse.content.toLowerCase().includes('knowledge base') ||
                            citationResponse.content.toLowerCase().includes('based on') ||
                            citationResponse.content.includes('[KB:');
      
      console.log(`   Has citations: ${hasCitations ? '✅' : '❌'}`);
      console.log(`   References KB: ${hasKBReference ? '✅' : '❌'}`);
      if (hasCitations) {
        console.log(`   Citation count: ${citationResponse.citations.length}`);
      }
      
    } catch (error) {
      console.log('   ❌ Error testing citations:', error.message);
    }
    
    console.log('\n🎯 ENHANCED FEATURES TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Error in enhanced features test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedFeatures();
