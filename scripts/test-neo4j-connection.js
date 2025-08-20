// scripts/test-neo4j-connection.js
// Loads .env and tests Neo4j connection using neo4j-driver

require('dotenv').config();
const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !user || !password) {
  console.error('Missing NEO4J_* env vars. Current values:');
  console.error('NEO4J_URI=', uri);
  console.error('NEO4J_USER=', user);
  console.error('NEO4J_PASSWORD=', password ? '***REDACTED***' : undefined);
  process.exit(2);
}

(async () => {
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  let session;
  try {
    session = driver.session();
    const result = await session.run('RETURN 1 AS v');
    const v = result.records[0].get('v');
    console.log('✅ Neo4j test query succeeded, result:', v);
    await session.close();
    await driver.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Neo4j connection/test failed:', err);
    try { if (session) await session.close(); } catch (_) {}
    try { await driver.close(); } catch (_) {}
    process.exit(1);
  }
})();
