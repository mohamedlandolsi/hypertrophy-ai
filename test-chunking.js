const { cleanText, chunkFitnessContent } = require('./src/lib/text-chunking.js');

// Test HTML content similar to what was in the database
const testHtmlContent = `
<p><span style="color: rgb(27, 28, 29)">While building strength and building muscle size (hypertrophy) are closely related, the training methods used to prioritize each goal are distinct.</span> This guide provides a clear instruction on the key differences between a program designed for maximal strength and a program designed for maximal muscle growth.</p>
<p></p>
<hr>
<p></p>
<h3><strong>1. Understanding the Primary Goal</strong></h3>
<p></p>
<ul>
<li><p><strong>Strength Training:</strong> The primary objective is to increase the maximum force a muscle can produce in a single effort.</p></li>
<li><p><strong>Hypertrophy Training:</strong> The primary objective is to increase the cross-sectional area (size) of muscle fibers.</p></li>
</ul>
<p>Both forms of training will lead to improvements in both strength and size, but the emphasis and methodology differ significantly.</p>
<h3><strong>2. Key Programming Differences</strong></h3>
<p><strong>Repetition Ranges</strong></p>
<ul>
<li><p><strong>Strength:</strong> 1-5 repetitions per set</p></li>
<li><p><strong>Hypertrophy:</strong> 6-20 repetitions per set</p></li>
</ul>
`;

async function testChunking() {
  try {
    console.log('🧪 Testing updated chunking with HTML content...\n');
    
    // Test the cleanText function
    console.log('📝 Original HTML content length:', testHtmlContent.length);
    const cleanedText = cleanText(testHtmlContent);
    console.log('🧹 Cleaned text length:', cleanedText.length);
    console.log('✨ Cleaned text preview:');
    console.log(cleanedText.substring(0, 300) + '...\n');
    
    // Test chunking
    const chunks = chunkFitnessContent(testHtmlContent);
    console.log(`✂️ Created ${chunks.length} chunks`);
    
    if (chunks.length > 0) {
      console.log('\n📄 First chunk:');
      console.log(chunks[0].content);
      console.log('\n📊 Chunk info:');
      chunks.forEach((chunk, i) => {
        console.log(`  Chunk ${i}: ${chunk.content.length} chars`);
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing chunking:', error);
  }
}

testChunking();
