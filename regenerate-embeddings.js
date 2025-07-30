const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function regenerateEmbeddings() {
  try {
    console.log('🔧 Starting embedding regeneration process...\n');

    // Get all chunks that need embeddings
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        embeddingData: null,
        knowledgeItem: {
          status: 'READY'
        }
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${chunks.length} chunks that need embeddings`);

    if (chunks.length === 0) {
      console.log('✅ All chunks already have embeddings!');
      return;
    }

    // Initialize embedding model
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    let processed = 0;
    let errors = 0;

    for (const chunk of chunks) {
      try {
        console.log(`🔄 Processing chunk ${processed + 1}/${chunks.length} from "${chunk.knowledgeItem.title}"`);
        
        // Generate embedding
        const embeddingResult = await embeddingModel.embedContent(chunk.content);
        const embedding = embeddingResult.embedding.values;

        // Store embedding as JSON string
        const embeddingData = JSON.stringify(embedding);

        // Update chunk with embedding
        await prisma.knowledgeChunk.update({
          where: { id: chunk.id },
          data: { embeddingData }
        });

        processed++;
        
        // Add a small delay to avoid rate limiting
        if (processed % 10 === 0) {
          console.log(`✅ Processed ${processed}/${chunks.length} chunks`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay every 10 requests
        }

      } catch (error) {
        console.error(`❌ Error processing chunk ${chunk.id}:`, error.message);
        errors++;
        
        // Continue with next chunk
        continue;
      }
    }

    console.log(`\n🎉 Embedding regeneration completed!`);
    console.log(`✅ Successfully processed: ${processed}`);
    console.log(`❌ Errors: ${errors}`);

    if (processed > 0) {
      console.log('\n🔍 Verifying embedding generation...');
      const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
        where: {
          embeddingData: { not: null },
          knowledgeItem: { status: 'READY' }
        }
      });
      console.log(`✅ Chunks with embeddings now: ${chunksWithEmbeddings}`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateEmbeddings();
