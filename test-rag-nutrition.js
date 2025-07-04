const fs = require('fs');

// Test the RAG system with a different query
async function testRAGSystemNutrition() {
  try {
    console.log('🧪 Testing RAG System - Nutrition Query');
    console.log('======================================');

    const response = await fetch('http://localhost:3000/api/test-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "How much protein do I need for muscle building?",
        userId: "3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba"
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Response received');
      console.log('   Message:', data.message);
      console.log('   User ID:', data.userId);
      console.log('   Response length:', data.responseLength, 'characters');
      console.log('\n📝 FULL RESPONSE:');
      console.log('================');
      console.log(data.response);
      console.log('\n================');
      
      // Check for RAG indicators
      const response_text = data.response.toLowerCase();
      const hasKnowledgeIndicators = response_text.includes('scientific reference material') || 
                                   response_text.includes('according to') || 
                                   response_text.includes('based on the provided') ||
                                   response_text.includes('reference material') ||
                                   response_text.includes('the document') ||
                                   response_text.includes('research shows') ||
                                   response_text.includes('studies indicate');
      
      const usesGenericResponse = response_text.includes('drawing from my general knowledge') ||
                                response_text.includes('general knowledge base') ||
                                response_text.includes('from what i know generally');
      
      const hasSpecificKnowledgeTerms = response_text.includes('protein synthesis') ||
                                      response_text.includes('leucine') ||
                                      response_text.includes('amino acids') ||
                                      response_text.includes('g/kg') ||
                                      response_text.includes('grams per kilogram');
      
      console.log('\n🔍 RAG Analysis:');
      console.log('   Contains knowledge indicators:', hasKnowledgeIndicators ? '✅ Yes' : '❌ No');
      console.log('   Uses generic response:', usesGenericResponse ? '❌ Yes' : '✅ No');
      console.log('   Contains specific knowledge terms:', hasSpecificKnowledgeTerms ? '✅ Yes' : '❌ No');
      
      // Save the response to file for detailed analysis
      fs.writeFileSync('rag-test-nutrition-response.txt', data.response);
      console.log('\n📄 Full response saved to rag-test-nutrition-response.txt');
      
    } else {
      console.error('❌ API Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testRAGSystemNutrition();
