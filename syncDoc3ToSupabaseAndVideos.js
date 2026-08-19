const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

const doc3VideoMap = JSON.parse(fs.readFileSync('doc3_video_map.json', 'utf8'));
const modalityVideosPath = 'lib/data/modalityVideos.ts';
let videoCode = fs.readFileSync(modalityVideosPath, 'utf8');

Object.entries(doc3VideoMap).forEach(([id, info]) => {
  const keyQuote = `'${id}':`;
  if (!videoCode.includes(keyQuote)) {
    const insertStr = `  '${id}': {\n    youtubeVideoId: '${info.videoId}',\n    videoStartSeconds: 0,\n    videoTitle: '${info.title.replace(/'/g, "\\'")}'\n  },\n`;
    videoCode = videoCode.replace('export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {', 'export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {\n' + insertStr);
  }
});

fs.writeFileSync(modalityVideosPath, videoCode);
console.log('Successfully updated modalityVideos.ts with Doc 3 videos!');

const mods = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));

async function syncDoc3() {
  console.log('Syncing Doc 3 research modalities to Supabase...');
  let count = 0;
  for (const m of mods) {
    if (m.mechanism_of_action && m.mechanism_of_action.length > 500) {
      const payload = {
        id: m.id,
        slug: m.slug || m.id,
        name: m.name,
        display_name: m.display_name || m.name,
        category: m.category,
        brief_description: m.brief_description,
        dose_or_exposure: m.dose_or_exposure,
        timing_summary: m.timing_summary,
        instructions: m.instructions,
        evidence_summary: m.evidence_summary || m.mechanism_of_action,
        mechanism_of_action: m.mechanism_of_action
      };
      const { error } = await supabase.from('modalities').upsert(payload, { onConflict: 'id' });
      if (error) console.error('Error syncing:', m.id, error.message);
      else {
        count++;
        console.log(`Synced to Supabase: "${m.id}" (${m.mechanism_of_action.length} chars)`);
      }
    }
  }
  console.log(`Successfully synced ${count} modality records to Supabase!`);
}

syncDoc3();
