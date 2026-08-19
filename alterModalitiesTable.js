const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const env = envFile.split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key && val) acc[key] = val.trim();
    return acc;
  }, {});

  // Construct a standard PostgreSQL connection string
  // If NEXT_PUBLIC_SUPABASE_URL is http://127.0.0.1:54321, 
  // Postgres runs on port 54322 (default for local supabase)
  // Let's connect using the standard user/pass for local supabase
  const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    await client.query("ALTER TABLE modalities ADD COLUMN IF NOT EXISTS scientific_references JSONB DEFAULT '[]'::jsonb;");
    console.log("Successfully added scientific_references column.");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    await client.end();
  }
}

run();
