const crypto = require('crypto');

console.log('=== Fixing Supabase Service Role Key ===\n');

// The current (broken) service role key has "rose" instead of "role"
const brokenKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieHFvYWV5dG11YWJvcHdsbmd5Iiwicm9zZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk5MjI5OCwiZXhwIjoyMDYzNTY4Mjk4fQ.g50ym63TJM6PsmpZeTeAPpA9rATYqwZ0AAx--q46Jyo';

// Decode the broken key to see the issue
console.log('Current broken JWT payload:');
const brokenParts = brokenKey.split('.');
const brokenPayload = JSON.parse(Buffer.from(brokenParts[1], 'base64').toString());
console.log(JSON.stringify(brokenPayload, null, 2));
console.log('Issue: "rose" should be "role"\n');

// Since we don't have the JWT secret, we'll need to get the correct key from Supabase dashboard
console.log('=== SOLUTION ===');
console.log('The service role key has a typo in the JWT payload.');
console.log('You need to get the correct service role key from your Supabase dashboard:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/kbxqoaeytmuabopwlngy/settings/api');
console.log('2. Look for "Project API keys" section');
console.log('3. Copy the "service_role" key (the long one, not the anon key)');
console.log('4. Replace the SUPABASE_SERVICE_ROLE_KEY in your .env file');
console.log('\nThe corrected key should have this payload structure:');
console.log(JSON.stringify({
  "iss": "supabase",
  "ref": "kbxqoaeytmuabopwlngy", 
  "role": "service_role",  // This should be "role", not "rose"
  "iat": 1747992298,
  "exp": 2063568298
}, null, 2));
