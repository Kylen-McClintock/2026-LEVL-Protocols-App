const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => { 
  const [k, ...v] = line.split('='); 
  if(k && v) acc[k] = v.join('=').replace(/"/g, '').trim(); 
  return acc; 
}, {}); 

const { createClient } = require('@supabase/supabase-js'); 
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY); 

async function buildSeed() {
  console.log("Fetching all modalities...");
  const { data: modalities, error } = await supabase.from('modalities').select('*');
  
  if (error) {
    console.error("Error fetching modalities:", error);
    return;
  }

  console.log(`Fetched ${modalities.length} modalities.`);

  if (modalities.length === 0) return;

  const columns = Object.keys(modalities[0]).filter(c => c !== 'created_at'); // omit created_at

  let sql = `-- Master Seed File: Auto-generated from live database\n\n`;
  sql += `-- Reset existing modalities\nTRUNCATE TABLE modalities CASCADE;\n\n`;
  sql += `INSERT INTO modalities (\n  ${columns.join(',\n  ')}\n) VALUES \n`;

  const escapeString = (str) => {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str;
    if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
    if (typeof str === 'object') {
      if (Array.isArray(str)) {
        if (str.length === 0) return 'ARRAY[]::text[]';
        return `ARRAY[${str.map(s => escapeString(s)).join(', ')}]`;
      } else {
        return `'${JSON.stringify(str).replace(/'/g, "''")}'::jsonb`;
      }
    }
    return `'${String(str).replace(/'/g, "''")}'`;
  };

  const values = modalities.map(mod => {
    const rowValues = columns.map(col => escapeString(mod[col]));
    return `(\n  ${rowValues.join(',\n  ')}\n)`;
  });

  sql += values.join(',\n') + ';\n';

  fs.writeFileSync('supabase/seed.sql', sql);
  console.log('Successfully wrote master seed to supabase/seed.sql');
}

buildSeed();
