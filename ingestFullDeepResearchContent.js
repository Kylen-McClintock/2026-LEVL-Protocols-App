const fs = require('fs');

const doc1 = fs.readFileSync('/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8682/content.md', 'utf8');
const doc2 = fs.readFileSync('/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8727/content.md', 'utf8');

// Helper to strip HTML tags while preserving text and structure
function cleanHtmlText(html) {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<table[\s\S]*?<\/table>/gi, '') // Tables handled separately
    .replace(/<img[^>]+>/gi, '') // Images handled separately
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

// Helper to extract image URL from HTML block
function extractImageUrl(html) {
  const m = html.match(/<img[^>]+src=\"([^\"]+)\"/i);
  return m ? m[1] : null;
}

// Helper to extract table HTML/Markdown from HTML block
function extractTableHtml(html) {
  const m = html.match(/<table[\s\S]*?<\/table>/i);
  if (!m) return null;
  return m[0]
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

// Map of Doc 1 Modal IDs
const doc1Mapping = [
  {
    targetIds: ['sauna_exposure', 'hyperthermic_sauna'],
    startPattern: '11. Hyperthermic Sauna',
    endPattern: '12. Cold Water Immersion'
  },
  {
    targetIds: ['cold_plunge', 'cold_water_immersion', 'soberg_cold_water_immersion'],
    startPattern: '12. Cold Water Immersion / Cold Plunge',
    endPattern: '13. Søberg Principle Reheating'
  },
  {
    targetIds: ['soberg_reheating_principle'],
    startPattern: '13. Søberg Principle Reheating',
    endPattern: '14. Contrast Hydrotherapy'
  },
  {
    targetIds: ['contrast_hydrotherapy'],
    startPattern: '14. Contrast Hydrotherapy',
    endPattern: '15. Local Far-Infrared Sauna Therapy'
  },
  {
    targetIds: ['far_infrared_sauna'],
    startPattern: '15. Local Far-Infrared Sauna Therapy',
    endPattern: 'Part II: Breathwork'
  },
  {
    targetIds: ['cyclic_sighing', 'physiological_cyclic_sighing'],
    startPattern: '16. Physiological Cyclic Sighing',
    endPattern: '17. 4-7-8 Relaxing Breath Technique'
  },
  {
    targetIds: ['478_relaxing_breathing', 'four_seven_eight_breathing'],
    startPattern: '17. 4-7-8 Relaxing Breath Technique',
    endPattern: '18. Tactical Box Breathing'
  },
  {
    targetIds: ['box_breathing', 'tactical_box_breathing'],
    startPattern: '18. Tactical Box Breathing',
    endPattern: '19. Resonance Frequency Breathing'
  },
  {
    targetIds: ['resonance_frequency_breathing'],
    startPattern: '19. Resonance Frequency Breathing',
    endPattern: '20. Hypoxic Breath-Hold Retentions'
  },
  {
    targetIds: ['hypoxic_breath_retentions'],
    startPattern: '20. Hypoxic Breath-Hold Retentions',
    endPattern: 'Conclusion'
  }
];

// Map of Doc 2 Testing IDs
const doc2Mapping = [
  {
    targetIds: ['single_leg_balance', 'single_leg_stance'],
    startPattern: '1. Postural Control and Neuromotor Integrity',
    endPattern: '2. Lower Extremity Functional Power'
  },
  {
    targetIds: ['chair_stand_30s', '30s_chair_stand'],
    startPattern: '2. Lower Extremity Functional Power',
    endPattern: '3. Anthropological Mobility and Mortality Prediction'
  },
  {
    targetIds: ['sitting_rising_test'],
    startPattern: '3. Anthropological Mobility and Mortality Prediction',
    endPattern: '4. Central Nervous System Output and Gait Kinetics'
  },
  {
    targetIds: ['gait_speed', 'usual_gait_speed'],
    startPattern: '4. Central Nervous System Output and Gait Kinetics',
    endPattern: '5. Upper Extremity Neuromuscular Recruitment'
  },
  {
    targetIds: ['handgrip_strength', 'grip_strength'],
    startPattern: '5. Upper Extremity Neuromuscular Recruitment',
    endPattern: '6. Pulmonary Mechanics and Airway Resistance'
  },
  {
    targetIds: ['spirometry_fev1', 'pef'],
    startPattern: '6. Pulmonary Mechanics and Airway Resistance',
    endPattern: '7. Hemodynamic Stability and Autonomic Tone'
  },
  {
    targetIds: ['bp_sys', 'bp_dia', 'resting_bp'],
    startPattern: '7. Hemodynamic Stability and Autonomic Tone',
    endPattern: 'Synthesis and Architectural Integration'
  }
];

const allModalities = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));

// Process Doc 1
doc1Mapping.forEach(item => {
  const startIdx = doc1.indexOf(item.startPattern);
  const endIdx = item.endPattern ? doc1.indexOf(item.endPattern, startIdx) : doc1.length;
  
  if (startIdx !== -1) {
    const sectionHtml = doc1.substring(startIdx, endIdx !== -1 ? endIdx : doc1.length);
    const text = cleanHtmlText(sectionHtml);
    const image = extractImageUrl(sectionHtml);
    const table = extractTableHtml(sectionHtml);

    item.targetIds.forEach(id => {
      const idx = allModalities.findIndex(m => m.id === id);
      if (idx !== -1) {
        allModalities[idx].mechanism_of_action = text;
        if (image) allModalities[idx].diagram_url = image;
        if (table) allModalities[idx].hemodynamic_table = table;
        console.log(`Updated Doc1 Modality: ${id} | Length: ${text.length} chars | Image: ${Boolean(image)} | Table: ${Boolean(table)}`);
      }
    });
  }
});

// Process Doc 2
doc2Mapping.forEach(item => {
  const startIdx = doc2.indexOf(item.startPattern);
  const endIdx = item.endPattern ? doc2.indexOf(item.endPattern, startIdx) : doc2.length;
  
  if (startIdx !== -1) {
    const sectionHtml = doc2.substring(startIdx, endIdx !== -1 ? endIdx : doc2.length);
    const text = cleanHtmlText(sectionHtml);
    const image = extractImageUrl(sectionHtml);
    const table = extractTableHtml(sectionHtml);

    item.targetIds.forEach(id => {
      const idx = allModalities.findIndex(m => m.id === id);
      if (idx !== -1) {
        allModalities[idx].mechanism_of_action = text;
        if (image) allModalities[idx].diagram_url = image;
        if (table) allModalities[idx].hemodynamic_table = table;
        console.log(`Updated Doc2 Testing Modality: ${id} | Length: ${text.length} chars | Image: ${Boolean(image)} | Table: ${Boolean(table)}`);
      }
    });
  }
});

fs.writeFileSync('all_modalities.json', JSON.stringify(allModalities, null, 2));
console.log('Successfully updated all_modalities.json with full multi-paragraph research text, images, and tables!');
