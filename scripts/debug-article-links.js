// Quick test to verify article link extraction
console.log('Testing article link extraction...');

// Simulate the extraction function
function extractArticleLinks(content) {
  const articleLinks = [];
  const articleLinkRegex = /\[([^\]]+)\]\(article:([^)]+)\)/g;
  
  let match;
  while ((match = articleLinkRegex.exec(content)) !== null) {
    const [fullMatch, title, articleId] = match;
    
    console.log('Match found:');
    console.log('  Full match:', fullMatch);
    console.log('  Title:', title);
    console.log('  Article ID:', articleId);
    
    articleLinks.push({
      id: articleId,
      title: title,
      url: `/knowledge/${articleId}`
    });
  }
  
  const cleanContent = content.replace(articleLinkRegex, '$1');
  
  return { cleanContent, articleLinks };
}

// Test with sample content
const testContent = `For optimal muscle growth, you should train each working set to a level of 0-2 Repetitions in Reserve (RIR) [A Guide to Foundational Training Principles](article:cmctdh7kp0001l104txze2div). This means you should stop a set knowing you could only perform 0 to 2 more perfect repetitions.`;

console.log('Original content:', testContent);
console.log('\n--- Processing ---');

const result = extractArticleLinks(testContent);

console.log('\nResults:');
console.log('Clean content:', result.cleanContent);
console.log('Article links:', JSON.stringify(result.articleLinks, null, 2));

// Test what URL would be generated
if (result.articleLinks.length > 0) {
  console.log('\nGenerated URLs:');
  result.articleLinks.forEach((link, index) => {
    console.log(`  ${index + 1}. ${link.url}`);
  });
}
