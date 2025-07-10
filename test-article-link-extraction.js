// Test script to verify article link extraction functionality
const { extractArticleLinks, processMessageContent } = require('./src/lib/article-links.ts');

// Test message content with article links
const testMessage = `For optimal muscle growth, you should train each working set to a level of 0-2 Repetitions in Reserve (RIR) [A Guide to Foundational Training Principles](article:cmctdh7kp0001l104txze2div). This means you should stop a set knowing you could only perform 0 to 2 more perfect repetitions.

As an intermediate lifter, you can effectively use the RIR system. The final repetitions in a set are the most fatiguing; by leaving a few repetitions in reserve, you can manage Central Nervous System (CNS) fatigue, which allows for higher quality and effort in subsequent sets [A Guide to Foundational Training Principles](article:cmctdh7kp0001l104txze2div).`;

console.log('🧪 Testing Article Link Extraction...\n');

try {
  const result = processMessageContent(testMessage);
  
  console.log('✅ Original Message:');
  console.log(testMessage);
  console.log('\n📝 Clean Content (without links):');
  console.log(result.content);
  
  if (result.articleLinks) {
    console.log('\n🔗 Extracted Article Links:');
    result.articleLinks.forEach((link, index) => {
      console.log(`  ${index + 1}. Title: "${link.title}"`);
      console.log(`     ID: ${link.id}`);
      console.log(`     URL: ${link.url}`);
    });
  } else {
    console.log('\n❌ No article links found');
  }
  
  console.log('\n✅ Test completed successfully!');
  
} catch (error) {
  console.error('❌ Test failed:', error);
}
