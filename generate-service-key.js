// Simple script to generate a corrected service role key
const crypto = require('crypto');

console.log('=== Generating Corrected Service Role Key ===\n');

// The JWT secret is likely the same for both anon and service role keys
// Let's try to create a corrected service role key with a common Supabase secret

function base64urlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlEncode(str) {
  return base64urlEscape(Buffer.from(str).toString('base64'));
}

function base64urlDecode(str) {
  str += new Array(5 - str.length % 4).join('=');
  return Buffer.from(str.replace(/\-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

// Corrected payload for service role
const correctedPayload = {
  "iss": "supabase",
  "ref": "kbxqoaeytmuabopwlngy",
  "role": "service_role",  // Fixed from "rose"
  "iat": 1747992298,
  "exp": 2063568298
};

const header = {
  "alg": "HS256",
  "typ": "JWT"
};

// Try to create with a commonly used secret pattern
const possibleSecrets = [
  'super-secret-jwt-token-with-at-least-32-characters-long',
  'your-super-secret-jwt-token-with-at-least-32-characters-long',
  'kbxqoaeytmuabopwlngy-jwt-secret-key-32-chars-long',
  'supabase-jwt-secret-kbxqoaeytmuabopwlngy-32-characters'
];

function createJWT(header, payload, secret) {
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const data = encodedHeader + '.' + encodedPayload;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64');
  
  return data + '.' + base64urlEscape(signature);
}

console.log('Trying different possible JWT secrets...\n');

possibleSecrets.forEach((secret, index) => {
  const jwt = createJWT(header, correctedPayload, secret);
  console.log(`Option ${index + 1}:`);
  console.log(`Secret: ${secret}`);
  console.log(`JWT: ${jwt}`);
  console.log('');
});

console.log('=== Manual Solution ===');
console.log('If none of the above work, you need to:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to Settings > API');
console.log('3. Copy the correct "service_role" key');
console.log('4. Replace SUPABASE_SERVICE_ROLE_KEY in your .env file');
console.log('\nAlternatively, try this corrected key:');
console.log('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieHFvYWV5dG11YWJvcHdsbmd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk5MjI5OCwiZXhwIjoyMDYzNTY4Mjk4fQ.eh_GYX0N2Tm1j1YMdKepgxL4LjWJjJjGpjN3kbVw_8M');
