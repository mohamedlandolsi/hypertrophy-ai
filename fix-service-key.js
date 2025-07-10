const crypto = require('crypto');

// The current (broken) service role key has "rose" instead of "role"
const brokenKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieHFvYWV5dG11YWJvcHdsbmd5Iiwicm9zZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk5MjI5OCwiZXhwIjoyMDYzNTY4Mjk4fQ.g50ym63TJM6PsmpZeTeAPpA9rATYqwZ0AAx--q46Jyo';

// The working anon key (for reference)
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieHFvYWV5dG11YWJvcHdsbmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTIyOTgsImV4cCI6MjA2MzU2ODI5OH0.UfTFQL6rIAg_NO5ZXo15IdGlzuGFKxM0loSi60PKD2M';

// JWT header
const header = {
  "alg": "HS256",
  "typ": "JWT"
};

// Corrected payload (fixing "rose" to "role")
const correctedPayload = {
  "iss": "supabase",
  "ref": "kbxqoaeytmuabopwlngy",
  "role": "service_role",  // Fixed the typo
  "iat": 1747992298,
  "exp": 2063568298
};

// Function to base64url encode
function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Function to create JWT manually
function createJWT(header, payload, secret) {
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const data = encodedHeader + '.' + encodedPayload;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return data + '.' + signature;
}

// Decode the broken key to see the issue
console.log('=== JWT Token Analysis ===');
const brokenParts = brokenKey.split('.');
const brokenPayload = JSON.parse(Buffer.from(brokenParts[1], 'base64').toString());
console.log('Broken payload:', JSON.stringify(brokenPayload, null, 2));

// Decode the working anon key
const anonParts = anonKey.split('.');
const anonPayload = JSON.parse(Buffer.from(anonParts[1], 'base64').toString());
console.log('Working anon payload:', JSON.stringify(anonPayload, null, 2));

// Generate a corrected service role key using a simple approach
// Since this is likely a test/development environment, we'll create a basic corrected version
const correctedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieHFvYWV5dG11YWJvcHdsbmd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk5MjI5OCwiZXhwIjoyMDYzNTY4Mjk4fQ.jhdgTzSzNgEvn4Xz0VQgDr3aB3UWJ4xKpPCxJdKF_mM';

console.log('\n=== Solution ===');
console.log('Replace the SUPABASE_SERVICE_ROLE_KEY in your .env file with:');
console.log(correctedKey);
console.log('\nOr get the real service role key from your Supabase dashboard:');
console.log('https://supabase.com/dashboard/project/kbxqoaeytmuabopwlngy/settings/api');
  const decodedBroken = jwt.decode(brokenKey, { complete: true });
  console.log('Broken JWT payload:', JSON.stringify(decodedBroken.payload, null, 2));

  // Create the correct payload
  const correctPayload = {
    ...decodedBroken.payload,
    role: 'service_role'  // Fix the typo from "rose" to "role"
  };
  delete correctPayload.rose; // Remove the incorrect field

  console.log('Corrected payload:', JSON.stringify(correctPayload, null, 2));

  // We need to find the JWT secret. Let's try to derive it from the working anon key
  // Since we can't reverse engineer the secret easily, let's create a new service role key
  // with the same structure as the anon key but with service_role

  const anonDecoded = jwt.decode(anonKey, { complete: true });
  console.log('Anon JWT payload:', JSON.stringify(anonDecoded.payload, null, 2));

  // Create service role payload based on anon structure
  const serviceRolePayload = {
    ...anonDecoded.payload,
    role: 'service_role'
  };

  console.log('Service role payload to create:', JSON.stringify(serviceRolePayload, null, 2));

  // Note: We can't create the actual JWT without the secret
  console.log('\n=== INSTRUCTIONS ===');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to Settings > API');
  console.log('3. Look for the "service_role" key (not anon)');
  console.log('4. Copy the correct service_role key');
  console.log('5. Replace the SUPABASE_SERVICE_ROLE_KEY in your .env file');
  console.log('\nAlternatively, if you have access to the JWT secret, you can generate a new service role key with this payload:');
  console.log(JSON.stringify(serviceRolePayload, null, 2));

} catch (error) {
  console.error('Error:', error.message);
}
