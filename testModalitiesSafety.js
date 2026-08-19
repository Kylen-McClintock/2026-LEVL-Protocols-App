const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  envText.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllPairs() {
  const { data: modalities } = await supabase.from('modalities').select('*');
  console.log(`Loaded ${modalities.length} modalities.`);

  const sampleStack = modalities.slice(0, 5); // 5 active items in Today
  console.log(`Simulating active stack with: ${sampleStack.map(m => m.display_name || m.name).join(', ')}`);

  // Import compiled TS logic via node or test parsing
  function safeExtractList(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.map(String);
        if (typeof parsed === 'string') return [parsed];
      } catch {
        return val.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  let errorCount = 0;
  for (const m of modalities) {
    try {
      const syn = safeExtractList(m.synergy_notes?.pairsWellWith || m.synergy_notes);
      const ant = safeExtractList(m.antagonism_notes?.avoidCombiningWith || m.antagonism_notes);
      // test .some
      syn.some(p => p.includes('test'));
      ant.some(p => p.includes('test'));
    } catch (err) {
      console.error(`Error with modality [${m.id}]:`, err);
      errorCount++;
    }
  }

  console.log(`Test completed with ${errorCount} errors across all ${modalities.length} modalities!`);
}

testAllPairs();
