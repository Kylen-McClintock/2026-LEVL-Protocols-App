const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('http://127.0.0.1:54321', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')
    // Wait, the REST URL is not the postgres URL.
  });
  // Actually, I can't use `@supabase/supabase-js` to alter tables.
  // We can just rely on the REST API? No, REST can't do DDL.
}
