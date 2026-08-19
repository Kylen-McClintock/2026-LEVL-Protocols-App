const fs = require('fs');
const https = require('https');
const path = require('path');

// Helper to download image
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, response => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Helper to strip HTML tags while keeping clean text
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

// Helper to purge YouTube text blocks from text strings
function purgeYouTubeTextBlock(text) {
  if (!text) return '';
  // Remove lines starting with or containing YouTube URL, YouTube Video ID, Start Timestamp, Video Title, Why It Matches
  return text
    .split('\n')
    .filter(line => {
      const l = line.trim();
      if (l.startsWith('YouTube URL:') || l.includes('YouTube URL: http')) return false;
      if (l.startsWith('YouTube Video ID:') || l.includes('YouTube Video ID:')) return false;
      if (l.startsWith('Start Timestamp') || l.includes('Start Timestamp (seconds):')) return false;
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

function extractImageUrl(html) {
  const m = html.match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : null;
}

async function run() {
  console.log('--- Cleaning YouTube metadata text from ALL modalities ---');
  const mods = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));

  let cleanedCount = 0;
  mods.forEach((m, idx) => {
    if (m.mechanism_of_action) {
      const orig = m.mechanism_of_action;
      const cleaned = purgeYouTubeTextBlock(orig);
      if (orig !== cleaned) {
        mods[idx].mechanism_of_action = cleaned;
        cleanedCount++;
      }
    }
    if (m.evidence_summary) {
      const orig = m.evidence_summary;
      const cleaned = purgeYouTubeTextBlock(orig);
      if (orig !== cleaned) {
        mods[idx].evidence_summary = cleaned;
      }
    }
  });
  console.log(`Cleaned YouTube text blocks from ${cleanedCount} modality records.`);

  console.log('--- Parsing Doc 4 ---');
  const doc4Path = '/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8943/content.md';
  const doc4 = fs.readFileSync(doc4Path, 'utf8');

  const doc4Sections = [
    {
      name: 'Morning Light Viewing',
      pattern: 'Morning Solar Photobiomodulation',
      keywords: ['morning_sunlight', 'morning_light', 'sunlight'],
      endPattern: 'Red / Near-Infrared Photobiomodulation'
    },
    {
      name: 'Red Light Therapy',
      pattern: 'Red / Near-Infrared Photobiomodulation',
      keywords: ['red_light_therapy', 'photobiomodulation', 'red_light'],
      endPattern: 'Evening Blue-Light Blocking'
    },
    {
      name: 'Blue Light Blocking',
      pattern: 'Evening Blue-Light Blocking',
      keywords: ['blue_blocking_glasses', 'blue_light'],
      endPattern: 'Core Temperature Thermoregulatory'
    },
    {
      name: 'Sleep Cooling',
      pattern: 'Core Temperature Thermoregulatory',
      keywords: ['sleep_cooling', 'cool_room', 'thermoregulatory_sleep'],
      endPattern: 'Continuous Glucose Monitor'
    },
    {
      name: 'CGM Sensor',
      pattern: 'Continuous Glucose Monitor (CGM)',
      keywords: ['cgm', 'continuous_glucose'],
      endPattern: '24-Hour Ambulatory Blood Pressure'
    },
    {
      name: '24-Hour ABPM',
      pattern: '24-Hour Ambulatory Blood Pressure',
      keywords: ['abpm-24h-blood-pressure-monitor', 'abpm', 'ambulatory_bp'],
      endPattern: null
    }
  ];

  const imgDir = path.join(process.cwd(), 'public', 'images', 'modalities');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  const doc4VideoMap = {};

  for (let i = 0; i < doc4Sections.length; i++) {
    const sec = doc4Sections[i];
    const startIdx = doc4.indexOf(sec.pattern);
    const endIdx = sec.endPattern ? doc4.indexOf(sec.endPattern, startIdx) : doc4.length;

    if (startIdx !== -1) {
      const htmlChunk = doc4.substring(startIdx, endIdx !== -1 ? endIdx : doc4.length);
      const text = purgeYouTubeTextBlock(cleanHtmlText(htmlChunk));
      const table = extractTableHtml(htmlChunk);
      const rawImgUrl = extractImageUrl(htmlChunk);

      // Extract YouTube link if present
      const ytMatch = htmlChunk.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = ytMatch ? ytMatch[1] : null;

      let localImgPath = null;
      if (rawImgUrl) {
        const filename = `doc4_diagram_${i + 1}.jpg`;
        const dest = path.join(imgDir, filename);
        try {
          await downloadFile(rawImgUrl, dest);
          localImgPath = `/images/modalities/${filename}`;
          console.log(`Downloaded image for ${sec.name} -> ${localImgPath} (${fs.statSync(dest).size} bytes)`);
        } catch (err) {
          console.error(`Failed downloading image for ${sec.name}:`, err.message);
        }
      }

      let matchCount = 0;
      mods.forEach((m, mIdx) => {
        const nameStr = `${m.id || ''} ${m.name || ''} ${m.display_name || ''}`.toLowerCase();
        if (sec.keywords.some(kw => nameStr.includes(kw))) {
          mods[mIdx].mechanism_of_action = text;
          mods[mIdx].evidence_summary = text;
          if (table) mods[mIdx].hemodynamic_table = table;
          if (localImgPath) {
            mods[mIdx].diagram_url = localImgPath;
            mods[mIdx].image_url = localImgPath;
          }
          if (videoId) {
            doc4VideoMap[m.id] = { videoId, title: `${m.display_name || m.name} Demo Video` };
          }
          matchCount++;
        }
      });

      console.log(`DOC4 SECTION: ${sec.name} | Text: ${text.length} chars | Table: ${Boolean(table)} | Image: ${Boolean(localImgPath)} | Video: ${videoId || 'None'} | Modalities Updated: ${matchCount}`);
    }
  }

  fs.writeFileSync('all_modalities.json', JSON.stringify(mods, null, 2));
  console.log('Saved cleaned and updated all_modalities.json');

  // Update modalityVideos.ts
  const modalityVideosPath = 'lib/data/modalityVideos.ts';
  let videoCode = fs.readFileSync(modalityVideosPath, 'utf8');

  Object.entries(doc4VideoMap).forEach(([id, info]) => {
    const keyQuote = `'${id}':`;
    if (!videoCode.includes(keyQuote)) {
      const insertStr = `  '${id}': {\n    youtubeVideoId: '${info.videoId}',\n    videoStartSeconds: 0,\n    videoTitle: '${info.title.replace(/'/g, "\\'")}'\n  },\n`;
      videoCode = videoCode.replace('export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {', 'export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {\n' + insertStr);
    }
  });

  fs.writeFileSync(modalityVideosPath, videoCode);
  console.log('Updated modalityVideos.ts with Doc 4 videos.');

  // Sync to Supabase
  const env = fs.readFileSync('.env.local', 'utf8');
  let url = '', key = '';
  env.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
  });

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key);

  console.log('Syncing all cleaned modality records to Supabase...');
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
        mechanism_of_action: m.mechanism_of_action,
        diagram_url: m.diagram_url || null,
        image_url: m.image_url || m.diagram_url || null
      };
      const { error } = await supabase.from('modalities').upsert(payload, { onConflict: 'id' });
      if (error) console.error('Error syncing:', m.id, error.message);
      else syncCount++;
    }
  }
  console.log(`Successfully synced ${syncCount} clean modality records to Supabase!`);
}

run();
