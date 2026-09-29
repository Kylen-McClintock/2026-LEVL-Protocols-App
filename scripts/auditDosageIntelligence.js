const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Inline cleanText & archetype detection matching modalityDosageEngine
function cleanTextForNumericDose(text) {
  if (!text) return { cleanedText: '' };
  let extractedTemperature = undefined;
  const tempMatch = text.match(/\b\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]\b(?:\s*[-–—/]\s*\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]\b)?(?:\s*\([0-9.]+\s*(?:°|º|deg|degrees)?\s*[FC]\))?/i);
  if (tempMatch) extractedTemperature = tempMatch[0].trim();

  let cleaned = text
    .replace(/\b\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]?\s*[-–—]\s*\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]\b/gi, '')
    .replace(/\(?\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]?\s*\/\s*\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]?\)?/gi, '')
    .replace(/\(?\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]\s*\([0-9.]+\s*(?:°|º|deg|degrees)?\s*[FC]\)\)?/gi, '')
    .replace(/\([0-9.]+\s*(?:°|º|deg|degrees)?\s*[FC]\)/gi, '')
    .replace(/\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)\s*[FC]?\+?/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*[FC]\b\+?/gi, '')
    .replace(/\b\d{1,2}:\d{2}\s*(?:[ap]m)?\b/gi, '')
    .replace(/\d+(?:\.\d+)?\s*%/g, '')
    .replace(/[<>]?\s*\d+(?:,\d+)?\s*(?:lux|lx)\b/gi, '')
    .replace(/\d+\s*(?:nm|nanometer|nanometre)\b/gi, '')
    .replace(/\b\d+\s*bpm\b/gi, '')
    .replace(/\b\d+\/\d+\s*mmhg\b/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*mmol(?:\/L)?\b/gi, '');

  return { cleanedText: cleaned, extractedTemperature };
}

function getArchetype(m) {
  const name = (m.display_name || m.name || '').toLowerCase();
  const cat = (m.category || '').toLowerCase();
  const modType = (m.modality_type || '').toLowerCase();
  const logType = (m.logging_type || '').toLowerCase();

  const isOralSleepSupp = (
    logType === 'supplement' || 
    modType === 'supplement' || 
    cat.includes('supplement') || 
    cat.includes('nutraceutical') ||
    cat.includes('botanical') ||
    name.includes('apigenin') ||
    name.includes('magnesium') ||
    name.includes('gaba') ||
    name.includes('theanine') ||
    name.includes('melatonin') ||
    name.includes('glycine') ||
    name.includes('inositol') ||
    name.includes('saffron') ||
    name.includes('valerian') ||
    name.includes('tart-cherry') ||
    name.includes('cherry') ||
    name.includes('kiwifruit') ||
    name.includes('cbd') ||
    name.includes('deepcell') ||
    name.includes('extract') ||
    name.includes('powder') ||
    Boolean(m.dose_or_exposure && (/\bmg\b/i.test(m.dose_or_exposure) || m.dose_or_exposure.includes('g / serving') || /\bcapsule/i.test(m.dose_or_exposure)))
  );

  if (isOralSleepSupp) return 'supplement';

  const isNapOrDaytimeRest = name.includes('nap') || name.includes('eyes-closed') || name.includes('waking rest');
  if (isNapOrDaytimeRest) return 'nsdr';

  const isBlueLight = name.includes('blue light') || name.includes('screen') || name.includes('sunset');
  if (isBlueLight) return 'blue_light_dimming';

  const isOptic = name.includes('optic flow');
  if (isOptic) return 'cardio';

  if (name.includes('sauna') || name.includes('plunge') || name.includes('cold') || cat.includes('thermal')) return 'thermal';
  if (name.includes('breath') || name.includes('sigh') || cat.includes('breath')) return 'breathwork';
  if (name.includes('nsdr') || name.includes('nidra')) return 'nsdr';
  if (name.includes('fasting') || name.includes('trf') || cat.includes('fasting')) return 'fasting';
  if (name.includes('caffeine')) return 'caffeine_cutoff';
  if (name.includes('sunlight') || name.includes('morning sun')) return 'sunlight';
  if (name.includes('red light') || name.includes('photobiomodulation')) return 'red_light';
  if (cat.includes('cardio') || name.includes('run') || name.includes('zone 2') || name.includes('hiit') || name.includes('vo2')) return 'cardio';
  if (cat.includes('fitness') || cat.includes('strength') || name.includes('lift') || name.includes('push-up') || name.includes('squat')) return 'strength';
  if (cat.includes('skin') || name.includes('serum') || name.includes('cream') || name.includes('retinoid') || name.includes('spf')) return 'skincare';
  if (cat.includes('supplement') || cat.includes('nutraceutical') || cat.includes('vitamin') || cat.includes('mineral')) return 'supplement';
  if (cat.includes('diagnostic') || name.includes('scan') || name.includes('mri') || name.includes('dexa') || name.includes('panel')) return 'diagnostic';

  if (logType === 'sleep' || cat.includes('sleep') || name.includes('sleep') || name.includes('mouth tape') || name.includes('dark & cool') || name.includes('blackout')) {
    return 'sleep';
  }

  return 'general';
}

async function audit() {
  const { data, error } = await supabase.from('modalities').select('id, name, dose_or_exposure, category, modality_type, logging_type');
  if (error || !data) {
    console.error('Failed to fetch modalities:', error);
    return;
  }

  let sleepCount = 0;
  let thermalCount = 0;
  let errors = [];

  data.forEach(m => {
    const arch = getArchetype(m);
    const { cleanedText, extractedTemperature } = cleanTextForNumericDose(m.dose_or_exposure || '');
    const nums = (cleanedText.match(/\d+(?:\.\d+)?/g) || []).map(n => parseFloat(n));

    if (arch === 'sleep') {
      sleepCount++;
      // Sleep modalities must NEVER extract temperatures (like 65, 68) as primary dose
      if (nums.some(n => n > 14)) {
        errors.push(`[SLEEP CORRUPT] ${m.name}: extracted numbers [${nums.join(', ')}] from "${m.dose_or_exposure}"`);
      }
    }

    if (arch === 'thermal') {
      thermalCount++;
      // Thermal modalities must extract temperature
      if (!extractedTemperature && (m.dose_or_exposure || '').includes('°')) {
        errors.push(`[THERMAL MISSING TEMP] ${m.name}: failed to extract temp from "${m.dose_or_exposure}"`);
      }
    }
  });

  console.log(`Audited ${data.length} modalities.`);
  console.log(`Sleep modalities audited: ${sleepCount}`);
  console.log(`Thermal modalities audited: ${thermalCount}`);
  if (errors.length > 0) {
    console.log(`Found ${errors.length} errors:`);
    errors.forEach(e => console.log(' - ' + e));
  } else {
    console.log('ALL AUDITED MODALITIES PASSED SANITIZATION CHECKS! Zero corrupted units or numbers.');
  }
}

audit();
