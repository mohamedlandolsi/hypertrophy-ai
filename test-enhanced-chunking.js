/**
 * Test the enhanced chunking and embedding pipeline
 * Run from project root: node test-enhanced-chunking.js
 */

const { cleanText, splitIntoSentences, chunkText } = require('./src/lib/text-chunking');

// Test text that simulates common issues in fitness PDFs
const testText = `
Exercise Physiology and Muscle Hypertrophy.This research examines the mechanisms of muscle growth.

Resistance training promotes hypertrophy through several pathways:1)mechanical tension,2)metabolic stress,and 3)muscle damage.Dr.Smith et al.found that training volume significantly impacts growth.

Progressive overload is essential.Sets should be performed with 6-12 reps for hypertrophy.Rest periods of 60-90 sec between sets optimize metabolic stress.Fig.1 shows the relationship between volume and growth.

Research by Johnson et al.(2023)demonstrated that protein synthesis increases by 25% post-exercise.This effect lasts for 24-48 hours.Therefore,training frequency of 2-3x per week per muscle group is optimal.

The role of nutrition cannot be understated.Protein intake should be 1.6-2.2g/kg bodyweight daily.Leucine,in particular,triggers mTOR signaling pathway.
`;

async function testEnhancedChunking() {
  console.log('🧪 Testing Enhanced Chunking Pipeline\n');
  
  console.log('📝 Original text:');
  console.log(testText);
  console.log(`\nOriginal length: ${testText.length} characters\n`);
  
  // Test 1: Text cleaning
  console.log('🧹 Step 1: Text Cleaning');
  const cleanedText = cleanText(testText);
  console.log('Cleaned text:');
  console.log(cleanedText);
  console.log(`\nCleaned length: ${cleanedText.length} characters\n`);
  
  // Test 2: Sentence splitting
  console.log('✂️ Step 2: Sentence Splitting');
  const sentences = splitIntoSentences(cleanedText);
  console.log(`Found ${sentences.length} sentences:`);
  sentences.forEach((sentence, i) => {
    console.log(`${i + 1}. "${sentence}"`);
  });
  console.log();
  
  // Test 3: Chunking
  console.log('📦 Step 3: Chunking');
  const chunks = chunkText(cleanedText, {
    chunkSize: 512,
    chunkOverlap: 100,
    preserveSentences: true,
    preserveParagraphs: true,
    minChunkSize: 50
  });
  
  console.log(`Created ${chunks.length} chunks:`);
  chunks.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1} (${chunk.content.length} chars):`);
    console.log(`"${chunk.content}"`);
    console.log(`Position: ${chunk.startChar}-${chunk.endChar}`);
  });
  
  // Test 4: Overlap analysis
  console.log('\n🔗 Step 4: Overlap Analysis');
  for (let i = 0; i < chunks.length - 1; i++) {
    const currentChunk = chunks[i];
    const nextChunk = chunks[i + 1];
    
    // Simple overlap detection
    const currentEnd = currentChunk.content.slice(-50);
    const nextStart = nextChunk.content.slice(0, 50);
    
    console.log(`Chunks ${i + 1} → ${i + 2}:`);
    console.log(`  Current end: "...${currentEnd}"`);
    console.log(`  Next start: "${nextStart}..."`);
  }
  
  console.log('\n✅ Enhanced chunking pipeline test complete!');
}

// Run the test
testEnhancedChunking().catch(console.error);
