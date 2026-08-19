const fs = require('fs');

const doc5Path = '/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8979/content.md';
const doc5 = fs.readFileSync(doc5Path, 'utf8');

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

const doc5Sections = [
  { id: 'apigenin', pattern: 'apigenin — Apigenin (50mg)', keywords: ['apigenin'] },
  { id: 'nmn', pattern: 'nmn — NMN (Nicotinamide Mononucleotide)', keywords: ['nmn', 'nicotinamide_mononucleotide'] },
  { id: 'fisetin_quercetin_senolytic_pulse', pattern: 'fisetin_quercetin_senolytic_pulse', keywords: ['fisetin_quercetin', 'senolytic_pulse'] },
  { id: 'epa_dha_omega3', pattern: 'epa_dha_omega3', keywords: ['omega3', 'omega_3', 'epa_dha'] },
  { id: 'lions_mane', pattern: 'lions_mane', keywords: ['lions_mane', 'lion'] },
  { id: 'creatine_monohydrate', pattern: 'creatine_monohydrate', keywords: ['creatine'] },
  { id: 'glycine_supplementation', pattern: 'glycine_supplementation', keywords: ['glycine'] },
  { id: 'ashwagandha_ksm66', pattern: 'ashwagandha_ksm66', keywords: ['ashwagandha'] },
  { id: 'sinclair_nmn_tmg', pattern: 'sinclair_nmn_tmg', keywords: ['sinclair_nmn_tmg', 'tmg'] },
  { id: 'glp_1_receptor_agonists', pattern: 'glp_1_receptor_agonists', keywords: ['glp_1', 'glp1', 'semaglutide', 'tirzepatide'] },
  { id: 'sinclair_trans_resveratrol', pattern: 'sinclair_trans_resveratrol', keywords: ['sinclair_trans_resveratrol', 'resveratrol'] },
  { id: 'l_theanine', pattern: 'l_theanine — L-Theanine', keywords: ['theanine'] },
  { id: 'alpha_gpc', pattern: 'alpha_gpc — Alpha-GPC', keywords: ['alpha_gpc'] },
  { id: 'taurine', pattern: 'taurine — Taurine', keywords: ['taurine'] },
  { id: 'magnesium_glycinate', pattern: 'magnesium_glycinate', keywords: ['magnesium_glycinate', 'bisglycinate'] },
  { id: 'spermidine_supplement', pattern: 'spermidine_supplement', keywords: ['spermidine'] },
  { id: 'gaba', pattern: 'gaba — GABA', keywords: ['gaba'] }
];

const mods = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));
const doc5VideoMap = {};

doc5Sections.forEach((sec, idx) => {
  const startIdx = doc5.indexOf(sec.pattern);
  const nextSec = doc5Sections[idx + 1];
  const endIdx = nextSec ? doc5.indexOf(nextSec.pattern, startIdx) : doc5.length;

  if (startIdx !== -1) {
    const htmlChunk = doc5.substring(startIdx, endIdx !== -1 ? endIdx : doc5.length);
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
          doc5VideoMap[m.id] = { videoId, startSeconds, title: videoTitle };
        }
        matchCount++;
      }
    });

    console.log(`DOC5 SECTION: ${sec.id} | Text: ${text.length} chars | Table: ${Boolean(table)} | Video: ${videoId || 'None'} @ ${startSeconds}s | Modalities Updated: ${matchCount}`);
  }
});

fs.writeFileSync('all_modalities.json', JSON.stringify(mods, null, 2));
console.log('Successfully saved updated all_modalities.json with Doc 5 research data.');

// Update modalityVideos.ts
const modalityVideosPath = 'lib/data/modalityVideos.ts';
let videoCode = fs.readFileSync(modalityVideosPath, 'utf8');

Object.entries(doc5VideoMap).forEach(([id, info]) => {
  const keyQuote = `'${id}':`;
  const keyPlain = `${id}:`;
  const insertStr = `  '${id}': {\n    youtubeVideoId: '${info.videoId}',\n    videoStartSeconds: ${info.startSeconds},\n    videoTitle: '${info.title.replace(/'/g, "\\'")}'\n  },\n`;

  if (!videoCode.includes(keyQuote) && !videoCode.includes(keyPlain)) {
    videoCode = videoCode.replace('export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {', 'export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {\n' + insertStr);
  }
});

fs.writeFileSync(modalityVideosPath, videoCode);
console.log('Successfully updated modalityVideos.ts with Doc 5 videos.');

// Sync to Supabase
const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function syncDoc5ToSupabase() {
  console.log('Syncing updated Doc 5 modalities to Supabase Cloud DB...');
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

syncDoc5ToSupabase();
