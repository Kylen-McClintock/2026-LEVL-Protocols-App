const fs = require('fs');

const doc7Path = '/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/9021/content.md';
const doc7 = fs.readFileSync(doc7Path, 'utf8');

function cleanHtmlText(html) {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<table[\s\S]*?<\/table>/gi, '')
    .replace(/<img[^>]+>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function purgeYouTubeTextBlock(text) {
  if (!text) return '';
  return text
    .split('\n')
    .filter(line => {
      const l = line.trim();
      if (l.startsWith('YouTube URL:') || l.includes('YouTube URL: http')) return false;
      if (l.startsWith('YouTube Video ID:') || l.includes('YouTube Video ID:')) return false;
      if (l.startsWith('Start Timestamp') || l.includes('Start Timestamp')) return false;
      if (l.startsWith('Video Title:') || l.includes('Video Title:')) return false;
      if (l.startsWith('Why It Matches:') || l.includes('Why It Matches:')) return false;
      if (l.startsWith('Procedural Integration Video')) return false;
      return true;
    })
    .join('\n')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function extractTableHtml(html) {
  const m = html.match(/<table[\s\S]*?<\/table>/i);
  if (!m) return null;
  return m[0]
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

const doc7Sections = [
  { id: 'mental-fortitude-training', pattern: '[Mental Fortitude Training]', keywords: ['mental-fortitude-training', 'mental_fortitude'] },
  { id: 'mindfulness-meditation', pattern: '[Mindfulness Meditation]', keywords: ['mindfulness-meditation', 'mindfulness'] },
  { id: 'time-blocking', pattern: '[Time Blocking &amp; Cognitive Focus]', keywords: ['time-blocking', 'time_blocking'] },
  { id: 'post_meal_glucose_walk', pattern: '[Post-Meal Glucose Walk (10-15 min)]', keywords: ['post_meal_glucose_walk', 'post_meal_walk', 'glucose_walk'] },
  { id: 'intermittent_fasting_18_6', pattern: '[Time-Restricted Eating (18:6)]', keywords: ['intermittent_fasting_18_6', 'time_restricted_eating', '18_6'] },
  { id: 'longo_5day_fasting_mimicking_diet', pattern: '[5-Day Fasting Mimicking Diet (FMD)]', keywords: ['fasting_mimicking_diet', 'fmd', 'longo_5day'] },
  { id: 'sports-nutrition', pattern: '[Sports Nutrition &amp; Protein Synthesis Timing]', keywords: ['sports-nutrition', 'sports_nutrition', 'protein_synthesis'] },
  { id: 'sinclair_metformin_berberine', pattern: '[Metformin (850mg) or Berberine (1,000mg) AMPK Pulse]', keywords: ['sinclair_metformin_berberine', 'berberine', 'metformin'] }
];

const mods = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));
const doc7VideoMap = {};

doc7Sections.forEach((sec, idx) => {
  const startIdx = doc7.indexOf(sec.pattern);
  const nextSec = doc7Sections[idx + 1];
  const endIdx = nextSec ? doc7.indexOf(nextSec.pattern, startIdx) : doc7.length;

  if (startIdx !== -1) {
    const htmlChunk = doc7.substring(startIdx, endIdx !== -1 ? endIdx : doc7.length);
    const text = purgeYouTubeTextBlock(cleanHtmlText(htmlChunk));
    const table = extractTableHtml(htmlChunk);

    // Extract YouTube ID, timestamp, and title
    const ytMatch = htmlChunk.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = ytMatch ? ytMatch[1] : null;

    const timeMatch = htmlChunk.match(/t=(\d+)s/i) || htmlChunk.match(/Start Timestamp \(seconds\):\s*(\d+)/i);
    const startSeconds = timeMatch ? parseInt(timeMatch[1], 10) : 0;

    const titleMatch = htmlChunk.match(/Video Title:\s*([^<\n]+)/i);
    const videoTitle = titleMatch ? titleMatch[1].trim() : 'Video Demonstration';

    let matchCount = 0;
    mods.forEach((m, mIdx) => {
      const nameStr = `${m.id || ''} ${m.name || ''} ${m.display_name || ''}`.toLowerCase();
      if (sec.keywords.some(kw => nameStr.includes(kw))) {
        mods[mIdx].mechanism_of_action = text;
        mods[mIdx].evidence_summary = text;
        if (table) mods[mIdx].hemodynamic_table = table;
        if (videoId) {
          doc7VideoMap[m.id] = { videoId, startSeconds, title: videoTitle };
        }
        matchCount++;
      }
    });

    console.log(`DOC7 SECTION: ${sec.id} | Text: ${text.length} chars | Table: ${Boolean(table)} | Video: ${videoId || 'None'} @ ${startSeconds}s | Modalities Updated: ${matchCount}`);
  }
});

fs.writeFileSync('all_modalities.json', JSON.stringify(mods, null, 2));
console.log('Successfully saved updated all_modalities.json with Doc 7 research data.');

// Update modalityVideos.ts
const modalityVideosPath = 'lib/data/modalityVideos.ts';
let videoCode = fs.readFileSync(modalityVideosPath, 'utf8');

Object.entries(doc7VideoMap).forEach(([id, info]) => {
  const keyQuote = `'${id}':`;
  const keyPlain = `${id}:`;
  const insertStr = `  '${id}': {\n    youtubeVideoId: '${info.videoId}',\n    videoStartSeconds: ${info.startSeconds},\n    videoTitle: '${info.title.replace(/'/g, "\\'")}'\n  },\n`;

  if (!videoCode.includes(keyQuote) && !videoCode.includes(keyPlain)) {
    videoCode = videoCode.replace('export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {', 'export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {\n' + insertStr);
  }
});

fs.writeFileSync(modalityVideosPath, videoCode);
console.log('Successfully updated modalityVideos.ts with Doc 7 videos.');

// Sync to Supabase
const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function syncDoc7ToSupabase() {
  console.log('Syncing updated Doc 7 modalities to Supabase Cloud DB...');
  let syncCount = 0;
  for (const m of mods) {
    if (m.mechanism_of_action && m.mechanism_of_action.length > 50) {
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
      else syncCount++;
    }
  }
  console.log(`Successfully synced ${syncCount} clean modality records to Supabase!`);
}

syncDoc7ToSupabase();
