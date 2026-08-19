const fs = require('fs');

const doc3 = fs.readFileSync('/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8913/content.md', 'utf8');

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

const sections = [
  { name: 'Fisetin', pattern: 'High-Dose Fisetin Pulse', keywords: ['fisetin'] },
  { name: 'Quercetin + Dasatinib', pattern: 'Quercetin + Dasatinib', keywords: ['quercetin', 'dasatinib'] },
  { name: 'NMN / NR', pattern: 'NMN (Nicotinamide Mononucleotide)', keywords: ['nmn', 'nicotinamide_mononucleotide', 'tru_niagen'] },
  { name: 'Resveratrol', pattern: 'Trans-Resveratrol', keywords: ['resveratrol'] },
  { name: 'Acarbose', pattern: 'Acarbose', keywords: ['acarbose'] },
  { name: 'Metformin', pattern: 'Metformin', keywords: ['metformin'] },
  { name: 'Rapamycin', pattern: 'Rapamycin', keywords: ['rapamycin', 'sirolimus'] },
  { name: 'Extra Virgin Olive Oil', pattern: 'High-Polyphenol Extra Virgin Olive Oil', keywords: ['olive_oil', 'evoo', 'extra_virgin_olive_oil'] },
  { name: 'Spermidine', pattern: 'Spermidine', keywords: ['spermidine'] },
  { name: 'Creatine', pattern: 'Creatine Monohydrate', keywords: ['creatine'] },
  { name: 'GlyNAC', pattern: 'GlyNAC', keywords: ['glynac'] },
  { name: 'CoQ10 + PQQ', pattern: 'CoQ10 Ubiquinol + PQQ', keywords: ['coq10', 'ubiquinol', 'pqq'] },
  { name: 'TUDCA', pattern: 'TUDCA', keywords: ['tudca'] },
  { name: 'Magnesium L-Threonate', pattern: 'Magnesium L-Threonate', keywords: ['magnesium_l_threonate', 'threonate'] },
  { name: 'Apigenin', pattern: 'Apigenin', keywords: ['apigenin'] },
  { name: 'Sulforaphane', pattern: 'Sulforaphane', keywords: ['sulforaphane', 'glucoraphanin'] },
  { name: 'Berberine', pattern: 'Berberine HCl', keywords: ['berberine'] }
];

const mods = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));

const videoMap = {};

sections.forEach((sec, idx) => {
  const startIdx = doc3.indexOf(sec.pattern);
  const nextSec = sections[idx + 1];
  const endIdx = nextSec ? doc3.indexOf(nextSec.pattern, startIdx) : doc3.length;

  if (startIdx !== -1) {
    const htmlChunk = doc3.substring(startIdx, endIdx !== -1 ? endIdx : doc3.length);
    const text = cleanHtmlText(htmlChunk);
    
    // Find video link
    const ytMatch = htmlChunk.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = ytMatch ? ytMatch[1] : null;

    let matchedCount = 0;
    mods.forEach((m, mIdx) => {
      const nameStr = `${m.id || ''} ${m.name || ''} ${m.display_name || ''}`.toLowerCase();
      if (sec.keywords.some(kw => nameStr.includes(kw))) {
        mods[mIdx].mechanism_of_action = text;
        mods[mIdx].evidence_summary = text;
        if (videoId) videoMap[m.id] = { videoId, title: `${m.display_name || m.name} Video Research` };
        matchedCount++;
      }
    });

    console.log(`SECTION: ${sec.name} | Text: ${text.length} chars | Video: ${videoId || 'None'} | Modalities Updated: ${matchedCount}`);
  }
});

fs.writeFileSync('all_modalities.json', JSON.stringify(mods, null, 2));
fs.writeFileSync('doc3_video_map.json', JSON.stringify(videoMap, null, 2));
console.log('Successfully updated all_modalities.json with Doc 3 research data!');
