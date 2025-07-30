const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

// Initialize Gemini AI
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAIWithDeloadContext() {
  console.log('🧪 Testing AI Response to Deload Context...');
  
  try {
    // Get AI configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI Configuration found');
      return;
    }

    // Test query
    const userQuery = "What is a deload week?";
    
    // Generate embedding and get knowledge context (simulating the RAG process)
    const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(userQuery);
    const queryEmbedding = embeddingResult.embedding.values;
    
    // Get deload content from knowledge base (using a simple direct query)
    const deloadChunks = await prisma.knowledgeChunk.findMany({
      where: {
        content: {
          contains: 'deload',
          mode: 'insensitive'
        }
      },
      include: {
        knowledgeItem: {
          select: {
            id: true,
            title: true
          }
        }
      },
      take: 5
    });

    console.log(`📚 Found ${deloadChunks.length} deload-related chunks`);
    
    // Build knowledge context
    const knowledgeContext = deloadChunks.map(chunk => chunk.content).join('\n\n');
    
    console.log('\n📋 Knowledge Context Being Sent to AI:');
    console.log('=====================================');
    console.log(knowledgeContext.substring(0, 1000) + '...');
    console.log('=====================================');

    // Build system instruction exactly as done in the real system
    const systemInstruction = `${config.systemPrompt}

---
## Knowledge Base Context
The following information has been retrieved from the knowledge base to answer the user's query.

${knowledgeContext}
---

## Critical Instructions for Your Response
- **Prioritize Knowledge Base:** You MUST base your answer primarily on the provided "Knowledge Base Context." It is your single source of truth for this query.
- **Synthesize, Don't Repeat:** Integrate the information into your expert voice. Do not copy it verbatim.
- **Adhere to Context:** If the context contradicts your general knowledge, the context is correct. Follow it.
`;

    // Test with the AI model
    const modelConfig = { 
      model: config.freeModelName || 'gemini-2.5-flash',
      generationConfig: {
        temperature: config.temperature || 0.4,
        topK: config.topK || 30,
        topP: config.topP || 0.8,
        maxOutputTokens: config.maxTokens || 2000,
      },
      systemInstruction: systemInstruction
    };

    console.log('\n🤖 Testing AI Response...');
    console.log('Model:', modelConfig.model);
    console.log('Temperature:', modelConfig.generationConfig.temperature);
    
    const model = genAI.getGenerativeModel(modelConfig);
    
    const result = await model.generateContent([
      { text: userQuery }
    ]);

    const response = result.response.text();
    
    console.log('\n🎯 AI Response:');
    console.log('=====================================');
    console.log(response);
    console.log('=====================================');
    
    // Analyze the response
    const mentionsDeload = response.toLowerCase().includes('deload');
    const mentionsKnowledgeBase = response.toLowerCase().includes('knowledge base') || response.toLowerCase().includes('according to') || response.toLowerCase().includes('based on');
    const seemsToUseContext = response.length > 100; // Basic heuristic
    
    console.log('\n📊 Response Analysis:');
    console.log('- Mentions deload:', mentionsDeload);
    console.log('- References knowledge base:', mentionsKnowledgeBase);
    console.log('- Substantial response:', seemsToUseContext);
    console.log('- Response length:', response.length, 'characters');
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAIWithDeloadContext();
