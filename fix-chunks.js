const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple HTML to text converter
function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<br\s*\/?>/gi, '\n') // Convert br to newlines
    .replace(/<\/p>/gi, '\n\n') // Convert closing p to double newlines
    .replace(/<\/div>/gi, '\n') // Convert closing div to newlines
    .replace(/<\/h[1-6]>/gi, '\n\n') // Convert closing headers to double newlines
    .replace(/<li[^>]*>/gi, '• ') // Convert li to bullet points
    .replace(/<\/li>/gi, '\n') // Convert closing li to newlines
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/&nbsp;/g, ' ') // Convert &nbsp; to spaces
    .replace(/&amp;/g, '&') // Convert &amp; to &
    .replace(/&lt;/g, '<') // Convert &lt; to <
    .replace(/&gt;/g, '>') // Convert &gt; to >
    .replace(/&quot;/g, '"') // Convert &quot; to "
    .replace(/&#39;/g, "'") // Convert &#39; to '
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines to 2
    .trim();
}

// Simple text chunking function
function simpleChunkText(text, chunkSize = 512, overlap = 100) {
  const chunks = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    
    // Try to end at a sentence boundary if possible
    if (end < text.length) {
      const lastSentenceEnd = Math.max(
        text.lastIndexOf('.', end),
        text.lastIndexOf('!', end),
        text.lastIndexOf('?', end)
      );
      
      if (lastSentenceEnd > start + 100) { // Don't make chunks too small
        end = lastSentenceEnd + 1;
      }
    }
    
    const chunkContent = text.slice(start, end).trim();
    
    if (chunkContent.length > 50) { // Only include meaningful chunks
      chunks.push({
        content: chunkContent,
        index: chunkIndex++,
        startChar: start,
        endChar: end
      });
    }
    
    // Move start position with overlap
    start = Math.max(start + 1, end - overlap);
  }
  
  return chunks;
}

async function processKnowledgeItems() {
  try {
    console.log('🔄 Processing knowledge items without chunks...\n');

    // Get all knowledge items without chunks
    const itemsWithoutChunks = await prisma.knowledgeItem.findMany({
      where: {
        status: 'READY',
        type: 'TEXT',
        chunks: {
          none: {}
        }
      }
    });

    console.log(`Found ${itemsWithoutChunks.length} items without chunks\n`);

    for (const item of itemsWithoutChunks) {
      console.log(`🔄 Processing: "${item.title}"`);
      
      if (!item.content) {
        console.log('  ❌ No content found, skipping');
        continue;
      }

      try {
        // Convert HTML to plain text
        const plainText = htmlToText(item.content);
        console.log(`  📝 Converted ${item.content.length} chars HTML to ${plainText.length} chars text`);
        
        if (plainText.length < 50) {
          console.log('  ⚠️ Content too short after conversion, skipping');
          continue;
        }

        // Create chunks
        const chunks = simpleChunkText(plainText);
        console.log(`  ✂️ Created ${chunks.length} chunks`);

        if (chunks.length === 0) {
          console.log('  ❌ No chunks created, skipping');
          continue;
        }

        // Delete any existing chunks
        await prisma.knowledgeChunk.deleteMany({
          where: { knowledgeItemId: item.id }
        });

        // Create new chunks in database
        const chunkData = chunks.map(chunk => ({
          knowledgeItemId: item.id,
          content: chunk.content,
          chunkIndex: chunk.index,
          embeddingData: null // No embeddings for now
        }));

        await prisma.knowledgeChunk.createMany({
          data: chunkData
        });

        console.log(`  ✅ Successfully created ${chunks.length} chunks`);

      } catch (error) {
        console.log(`  ❌ Error processing item: ${error.message}`);
      }
    }

    // Show final statistics
    const finalStats = await prisma.knowledgeItem.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            chunks: true
          }
        }
      }
    });

    console.log('\n📊 Final statistics:');
    finalStats.forEach(item => {
      console.log(`  ${item.title}: ${item._count.chunks} chunks`);
    });

    console.log('\n✅ Processing complete');

  } catch (error) {
    console.error('❌ Error processing items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processKnowledgeItems();
