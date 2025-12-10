// MCP Identity Verifications SQL test runner (Node.js via node-postgres)
// Prerequisites:
// - Install PostgreSQL client library: npm install pg
// - Ensure DATABASE_URL environment variable is set, or fallback to a default test DB URL

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runSqlTest() {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://mcp_dev_user:mcp_dev_pass@db-dev.local:5432/mcp_dev_db";
  const sqlFilePath = path.resolve(__dirname, 'mcp_identity_verifications_test.sql');
  let sql;
  try {
    sql = fs.readFileSync(sqlFilePath, 'utf8');
  } catch (err) {
    console.error(`Failed to read SQL file at ${sqlFilePath}:`, err);
    process.exit(1);
  }
  // Debug: show which file path was read and a snippet of raw content
  console.debug("SQL file path:", sqlFilePath);
  console.debug("Raw SQL snippet (first 200 chars):", (sql || '').substring(0, 200));
  // Preprocess: robustly convert JavaScript-style // comments to SQL -- comments
  // Approach:
  // 1) Normalize line endings
  // 2) Convert lines that start with // (possibly after whitespace) to SQL comments
  // 3) Preserve all other lines as-is
  const normalizedSql = sql.replace(/\r\n/g, "\n");
  const withoutBlockComments = normalizedSql.replace(/\/\*[\s\S]*?\*\//g, '');
  const sqlPrepared = withoutBlockComments
    .split("\n")
    .map((line) => line.replace(/^\s*\/\/\s?/, "-- "))
    .join("\n");
  // Debug: show first 200 chars of prepared SQL to help diagnose issues in logs
  console.debug("Prepared SQL snippet:", (sqlPrepared || '').substring(0, 200));
  // If prepared SQL still begins with '//' that's unexpected — dump more info
  if ((sqlPrepared || '').trim().startsWith('//')) {
    console.error("Prepared SQL unexpectedly starts with '//' — raw and prepared content follow:");
    console.error("RAW SQL (first 2000 chars):", (sql || '').substring(0, 2000));
    console.error("PREPARED SQL (first 2000 chars):", (sqlPrepared || '').substring(0, 2000));
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    console.log(`Connecting to DB: ${databaseUrl}`);
    await client.connect();
    console.log('Running MCP identity_verifications test SQL script...');
    await client.query(sqlPrepared);
    console.log('Test script executed successfully.');
  } catch (err) {
    console.error('Test script execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runSqlTest().catch((err) => {
  console.error('Unhandled error in test runner:', err);
  process.exit(1);
});


