const fs = require('fs');

const doc1 = fs.readFileSync('/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8682/content.md', 'utf8');
const doc2 = fs.readFileSync('/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8727/content.md', 'utf8');

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

function extractImageUrl(html) {
  const m = html.match(/<img[^>]+src=\"([^\"]+)\"/i);
  return m ? m[1] : null;
}

function extractTableHtml(html) {
  const m = html.match(/<table[\s\S]*?<\/table>/i);
  if (!m) return null;
  return m[0]
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

const researchTopics = [
  // Doc 1 Topics
  {
    doc: 1,
    keywords: ['sauna', 'hyperthermic'],
    startPattern: '11. Hyperthermic Sauna',
    endPattern: '12. Cold Water Immersion'
  },
  {
    doc: 1,
    keywords: ['cold plunge', 'cold water', 'ice bath', 'cold shock'],
    startPattern: '12. Cold Water Immersion / Cold Plunge',
    endPattern: '13. Søberg Principle Reheating'
  },
  {
    doc: 1,
    keywords: ['soberg', 'søberg', 'reheating'],
    startPattern: '13. Søberg Principle Reheating',
    endPattern: '14. Contrast Hydrotherapy'
  },
  {
    doc: 1,
    keywords: ['contrast hydrotherapy', 'contrast therapy'],
    startPattern: '14. Contrast Hydrotherapy',
    endPattern: '15. Local Far-Infrared Sauna Therapy'
  },
  {
    doc: 1,
    keywords: ['far-infrared', 'far infrared', 'infrared sauna'],
    startPattern: '15. Local Far-Infrared Sauna Therapy',
    endPattern: 'Part II: Breathwork'
  },
  {
    doc: 1,
    keywords: ['cyclic sighing', 'physiological sigh', 'double-inhale', 'double inhale'],
    startPattern: '16. Physiological Cyclic Sighing',
    endPattern: '17. 4-7-8 Relaxing Breath Technique'
  },
  {
    doc: 1,
    keywords: ['4-7-8', '478', 'four_seven_eight', 'breathing_4_7_8', 'weil'],
    startPattern: '17. 4-7-8 Relaxing Breath Technique',
    endPattern: '18. Tactical Box Breathing'
  },
  {
    doc: 1,
    keywords: ['box breathing', 'tactical box', 'navy seal breath'],
    startPattern: '18. Tactical Box Breathing',
    endPattern: '19. Resonance Frequency Breathing'
  },
  {
    doc: 1,
    keywords: ['resonance frequency', 'resonance breathing', '0.1 hz'],
    startPattern: '19. Resonance Frequency Breathing',
    endPattern: '20. Hypoxic Breath-Hold Retentions'
  },
  {
    doc: 1,
    keywords: ['hypoxic', 'wim hof method', 'breath-hold retention'],
    startPattern: '20. Hypoxic Breath-Hold Retentions',
    endPattern: 'Conclusion'
  },

  // Doc 2 Testing Topics
  {
    doc: 2,
    keywords: ['single_leg', 'single leg', 'one-leg', 'balance test'],
    startPattern: '1. Postural Control and Neuromotor Integrity',
    endPattern: '2. Lower Extremity Functional Power'
  },
  {
    doc: 2,
    keywords: ['chair_stand', 'chair stand', '30s chair'],
    startPattern: '2. Lower Extremity Functional Power',
    endPattern: '3. Anthropological Mobility and Mortality Prediction'
  },
  {
    doc: 2,
    keywords: ['sitting_rising', 'sitting-rising', 'srt'],
    startPattern: '3. Anthropological Mobility and Mortality Prediction',
    endPattern: '4. Central Nervous System Output and Gait Kinetics'
  },
  {
    doc: 2,
    keywords: ['gait_speed', 'gait speed', '4m walk', '4-meter walk'],
    startPattern: '4. Central Nervous System Output and Gait Kinetics',
    endPattern: '5. Upper Extremity Neuromuscular Recruitment'
  },
  {
    doc: 2,
    keywords: ['handgrip', 'grip_strength', 'grip strength', 'dynamometer'],
    startPattern: '5. Upper Extremity Neuromuscular Recruitment',
    endPattern: '6. Pulmonary Mechanics and Airway Resistance'
  },
  {
    doc: 2,
    keywords: ['spirometry', 'fev1', 'expiratory flow'],
    startPattern: '6. Pulmonary Mechanics and Airway Resistance',
    endPattern: '7. Hemodynamic Stability and Autonomic Tone'
  },
  {
    doc: 2,
    keywords: ['bp_sys', 'bp_dia', 'blood_pressure', 'blood pressure'],
    startPattern: '7. Hemodynamic Stability and Autonomic Tone',
    endPattern: 'Synthesis and Architectural Integration'
  }
];

const mods = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));
let updatedCount = 0;

researchTopics.forEach(topic => {
  const sourceDoc = topic.doc === 1 ? doc1 : doc2;
  const startIdx = sourceDoc.indexOf(topic.startPattern);
  const endIdx = topic.endPattern ? sourceDoc.indexOf(topic.endPattern, startIdx) : sourceDoc.length;
  
  if (startIdx !== -1) {
    const sectionHtml = sourceDoc.substring(startIdx, endIdx !== -1 ? endIdx : sourceDoc.length);
    const text = cleanHtmlText(sectionHtml);
    const image = extractImageUrl(sectionHtml);
    const table = extractTableHtml(sectionHtml);

    mods.forEach((m, idx) => {
      const nameStr = `${m.id || ''} ${m.name || ''} ${m.display_name || ''}`.toLowerCase();
      const isMatch = topic.keywords.some(kw => nameStr.includes(kw));

      if (isMatch) {
        mods[idx].mechanism_of_action = text;
        if (image) mods[idx].diagram_url = image;
        if (table) mods[idx].hemodynamic_table = table;
        if (!mods[idx].evidence_summary) mods[idx].evidence_summary = text;
        updatedCount++;
        console.log(`MATCHED & UPDATED: "${m.id}" (${m.name || m.display_name}) -> Text: ${text.length} chars | Img: ${Boolean(image)} | Table: ${Boolean(table)}`);
      }
    });
  }
});

fs.writeFileSync('all_modalities.json', JSON.stringify(mods, null, 2));
console.log(`TOTAL MODALITY RECORDS UPDATED: ${updatedCount}`);
