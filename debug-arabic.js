// Debug Arabic regex
const text = 'ما هي أفضل طريقة لبناء العضلات؟';
console.log('Text:', text);
console.log('Unicode codes:', [...text].map(c => c.charCodeAt(0).toString(16)));

const regex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const matches = text.match(regex);
console.log('Matches:', matches);
console.log('Match count:', matches ? matches.length : 0);

// Test simpler regex
const simpleRegex = /[\u0600-\u06FF]/g;
const simpleMatches = text.match(simpleRegex);
console.log('Simple matches:', simpleMatches);
console.log('Simple match count:', simpleMatches ? simpleMatches.length : 0);
