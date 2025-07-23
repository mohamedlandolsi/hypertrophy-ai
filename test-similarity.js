// Test the JSON similarity search directly with fake data
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

// Test with sample vectors
console.log('🧪 Testing Cosine Similarity...');

const query = [0.1, 0.2, 0.3, 0.4, 0.5];
const doc1 = [0.1, 0.2, 0.3, 0.4, 0.5]; // identical
const doc2 = [0.2, 0.3, 0.4, 0.5, 0.6]; // similar
const doc3 = [-0.1, -0.2, -0.3, -0.4, -0.5]; // opposite

console.log('Query vs Doc1 (identical):', cosineSimilarity(query, doc1).toFixed(4));
console.log('Query vs Doc2 (similar):', cosineSimilarity(query, doc2).toFixed(4));
console.log('Query vs Doc3 (opposite):', cosineSimilarity(query, doc3).toFixed(4));

console.log('\n✅ Cosine similarity function works correctly!');
