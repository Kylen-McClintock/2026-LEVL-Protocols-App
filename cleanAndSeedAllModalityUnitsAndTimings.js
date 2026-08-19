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

async function cleanAndSeed() {
  const { data: modalities, error } = await supabase.from('modalities').select('*');
  if (error) {
    console.error('Error fetching modalities:', error);
    return;
  }

  console.log(`Auditing and fixing ${modalities.length} database modalities...`);

  let count = 0;
  for (const mod of modalities) {
    const name = (mod.name || mod.display_name || mod.id).toLowerCase();
    const cat = (mod.category || '').toLowerCase();
    const type = (mod.modality_type || mod.logging_type || '').toLowerCase();

    let newDoseText = mod.dose_or_exposure || 'Standard dose';
    let newTimingSum = mod.timing_summary || '';
    let newRelationships = mod.relationships || {};
    let dosageProfile = newRelationships.dosage_profile || {};

    // ----------------------------------------------------
    // 1. DOSAGE CONTEXT FIXES
    // ----------------------------------------------------

    if (name.includes('handstand')) {
      newDoseText = '60 seconds hold';
      dosageProfile = {
        unit: 'seconds',
        starter_dose: 30,
        personalized_target_dose: 60,
        blueprint_dose: 120,
        starter_notes: 'Wall-supported inversion hold (30 seconds).',
        recommended_notes: 'Standard evidence-backed daily inversion hold (60 seconds).',
        blueprint_notes: 'Advanced freestanding hold target (120 seconds).',
        literature_range: { min: 15, max: 180, unit: 'seconds' },
        timing_preference: 'midday'
      };
      newTimingSum = 'Midday Focus / Posture Reset (12:00 PM - 2:00 PM)';
    } 
    else if (name.includes('postprandial') || name.includes('post-meal walk') || name.includes('glycemic walk')) {
      newDoseText = '10 minutes walk';
      dosageProfile = {
        unit: 'mins',
        starter_dose: 5,
        personalized_target_dose: 10,
        blueprint_dose: 20,
        starter_notes: 'Brisk 5-minute walk post-meal.',
        recommended_notes: 'Standard 10-minute postprandial walk to flatten glucose spike.',
        blueprint_notes: 'Extended 20-minute postprandial walk.',
        literature_range: { min: 5, max: 20, unit: 'mins' },
        timing_preference: 'post_meal'
      };
      newTimingSum = 'Post-Meal (Within 15-30m after eating)';
    }
    else if (name.includes('soleus push')) {
      newDoseText = '15 minutes';
      dosageProfile = {
        unit: 'mins',
        starter_dose: 10,
        personalized_target_dose: 15,
        blueprint_dose: 30,
        starter_notes: '10 mins seated soleus contractions while at desk.',
        recommended_notes: '15 mins seated soleus pushups for systemic oxidization.',
        blueprint_notes: '30 mins cumulative soleus contractions.',
        literature_range: { min: 5, max: 45, unit: 'mins' },
        timing_preference: 'midday'
      };
      newTimingSum = 'Midday / Desk Micro-Movement';
    }
    else if (name.includes('centenarian strength') || name.includes('strength & stability')) {
      newDoseText = '45 minutes';
      dosageProfile = {
        unit: 'mins',
        starter_dose: 30,
        personalized_target_dose: 45,
        blueprint_dose: 60,
        starter_notes: '30 mins foundational joint stability & isometric load.',
        recommended_notes: '45 mins Peter Attia Centenarian Decathlon strength routine.',
        blueprint_notes: '60 mins heavy compound strength & grip stability.',
        literature_range: { min: 30, max: 60, unit: 'mins' },
        timing_preference: 'morning'
      };
      newTimingSum = 'Morning / Fasted (8:00 AM - 10:00 AM)';
    }
    else if (name.includes('isometric handgrip')) {
      newDoseText = '4x 2-min holds (10 mins total)';
      dosageProfile = {
        unit: 'mins',
        starter_dose: 8,
        personalized_target_dose: 10,
        blueprint_dose: 15,
        starter_notes: '4x 2-min holds @ 30% MVC with 1-min rest.',
        recommended_notes: 'Standard Dayspring isometric handgrip protocol for endothelial shear stress.',
        blueprint_notes: '15 mins protocol with progressive MVC load.',
        literature_range: { min: 8, max: 15, unit: 'mins' },
        timing_preference: 'afternoon'
      };
      newTimingSum = 'Afternoon (2:00 PM - 5:00 PM)';
    }
    else if (name.includes('sauna') || name.includes('hyperthermic conditioning')) {
      newDoseText = '20 minutes @ 174°F+';
      dosageProfile = {
        unit: 'mins',
        starter_dose: 15,
        personalized_target_dose: 20,
        blueprint_dose: 30,
        starter_notes: '15 mins entry hyperthermic session.',
        recommended_notes: '20 mins @ 174°F+ (80°C+) sauna for heat shock proteins (HSP70).',
        blueprint_notes: '30 mins high-heat conditioning protocol.',
        literature_range: { min: 15, max: 30, unit: 'mins' },
        timing_preference: 'evening'
      };
      newTimingSum = 'Evening / Wind Down (5:00 PM - 8:00 PM)';
    }
    else if (name.includes('cold') || name.includes('plunge') || name.includes('immersion')) {
      newDoseText = '3 minutes @ 50°F-55°F';
      dosageProfile = {
        unit: 'mins',
        starter_dose: 2,
        personalized_target_dose: 3,
        blueprint_dose: 5,
        starter_notes: '2 mins cold water immersion (55°F).',
        recommended_notes: '3 mins cold plunge for 250% dopamine surge & brown fat activation.',
        blueprint_notes: '5 mins ice bath immersion.',
        literature_range: { min: 2, max: 5, unit: 'mins' },
        timing_preference: 'upon_waking'
      };
      newTimingSum = 'Upon Waking / Early Morning (6:30 AM - 8:30 AM)';
    }
    else if (name.includes('breathwork') || name.includes('sighing') || name.includes('breathing')) {
      newDoseText = '5 minutes';
      dosageProfile = {
        unit: 'mins',
        starter_dose: 3,
        personalized_target_dose: 5,
        blueprint_dose: 10,
        starter_notes: '3 mins vagal nerve activation.',
        recommended_notes: '5 mins clinical breathwork for autonomic recovery.',
        blueprint_notes: '10 mins deep respiratory reset.',
        literature_range: { min: 3, max: 10, unit: 'mins' },
        timing_preference: name.includes('4-7-8') ? 'wind_down' : 'midday'
      };
      newTimingSum = name.includes('4-7-8') ? 'Wind Down / Bedtime (8:30 PM - 10:00 PM)' : 'Midday Focus & Stress Reset (12:00 PM - 2:00 PM)';
    }
    else if (name.includes('mouth tap')) {
      newDoseText = 'Overnight (7-8 hours)';
      dosageProfile = {
        unit: 'hours',
        starter_dose: 7,
        personalized_target_dose: 8,
        blueprint_dose: 8,
        starter_notes: '7 hours sleep mouth taping for nitric oxide production.',
        recommended_notes: '8 hours full night sleep mouth taping.',
        blueprint_notes: '8 hours optimal nocturnal nasal breathing.',
        literature_range: { min: 7, max: 9, unit: 'hours' },
        timing_preference: 'bedtime'
      };
      newTimingSum = 'Bedtime / Overnight (10:00 PM - 6:00 AM)';
    }
    else if (name.includes('delay caffeine')) {
      newDoseText = 'Delay 90-120 minutes';
      dosageProfile = {
        unit: 'mins',
        starter_dose: 90,
        personalized_target_dose: 90,
        blueprint_dose: 120,
        starter_notes: 'Delay morning caffeine 90 mins post-waking.',
        recommended_notes: '90-120 mins delay allows natural adenosine clearance.',
        blueprint_notes: '120 mins delay for zero afternoon crash.',
        literature_range: { min: 90, max: 120, unit: 'mins' },
        timing_preference: 'upon_waking'
      };
      newTimingSum = 'Upon Waking (6:00 AM - 8:00 AM)';
    }
    else if (name.includes('acetic acid') || name.includes('apple cider vinegar')) {
      newDoseText = '1 tbsp in 8oz water';
      dosageProfile = {
        unit: 'tbsp',
        starter_dose: 1,
        personalized_target_dose: 1,
        blueprint_dose: 2,
        starter_notes: '1 tbsp ACV in 8oz water 15m pre-meal.',
        recommended_notes: '1 tbsp pre-meal load to slow gastric emptying.',
        blueprint_notes: '2 tbsp pre-meal for high-carb meals.',
        literature_range: { min: 1, max: 2, unit: 'tbsp' },
        timing_preference: 'pre_meal'
      };
      newTimingSum = 'Pre-Meal (15m before meal)';
    }
    else if (name.includes('berberine') || name.includes('acarbose')) {
      newDoseText = '500 mg';
      dosageProfile = {
        unit: 'mg',
        starter_dose: 250,
        personalized_target_dose: 500,
        blueprint_dose: 1000,
        starter_notes: '250mg starter dose with meal.',
        recommended_notes: '500mg GDA pre-high carbohydrate meal.',
        blueprint_notes: '500mg 2x daily with meals.',
        literature_range: { min: 250, max: 1000, unit: 'mg' },
        timing_preference: 'pre_meal'
      };
      newTimingSum = 'Pre-Meal / With Main Meal';
    }

    // Ensure non-supplement physical modalities don't have 'mg' unit in dosage profile!
    const isPhysical = cat.includes('fitness') || cat.includes('physical') || cat.includes('cardio') || cat.includes('strength') || cat.includes('breath') || cat.includes('mind') || cat.includes('sleep') || cat.includes('diagnostic');
    if (isPhysical && (!dosageProfile.unit || dosageProfile.unit === 'mg')) {
      if (name.includes('handstand')) dosageProfile.unit = 'seconds';
      else if (cat.includes('sleep') || name.includes('screen') || name.includes('environment')) dosageProfile.unit = 'hours';
      else if (cat.includes('diagnostic') || name.includes('mri') || name.includes('dexa') || name.includes('scan')) dosageProfile.unit = 'sessions';
      else dosageProfile.unit = 'mins';
    }

    newRelationships.dosage_profile = dosageProfile;

    // ----------------------------------------------------
    // 2. TIMING SUMMARY FALLBACK
    // ----------------------------------------------------

    if (!newTimingSum || newTimingSum.length === 0) {
      if (name.includes('morning') || name.includes('waking') || name.includes('sunlight') || name.includes('caffeine') || name.includes('nmn')) {
        newTimingSum = 'Upon Waking / Early Morning (6:00 AM - 8:00 AM)';
      } else if (name.includes('bed') || name.includes('night') || name.includes('sleep') || name.includes('magnesium') || name.includes('screen')) {
        newTimingSum = 'Wind Down / Pre-Bed (9:00 PM - 11:00 PM)';
      } else if (name.includes('post-meal') || name.includes('after meal')) {
        newTimingSum = 'Post-Meal (Within 15-30m after eating)';
      } else if (name.includes('pre-meal') || name.includes('before meal')) {
        newTimingSum = 'Pre-Meal (15m prior to eating)';
      } else if (name.includes('mri') || name.includes('dexa') || name.includes('cac') || name.includes('apob') || name.includes('scan') || name.includes('test')) {
        newTimingSum = 'Infrequent / Diagnostic Milestone';
      } else {
        newTimingSum = 'Morning / With Meal (8:00 AM - 10:00 AM)';
      }
    }

    // ----------------------------------------------------
    // 3. UPDATE SUPABASE
    // ----------------------------------------------------

    const { error: updateErr } = await supabase
      .from('modalities')
      .update({
        dose_or_exposure: newDoseText,
        timing_summary: newTimingSum,
        relationships: newRelationships
      })
      .eq('id', mod.id);

    if (updateErr) {
      console.error(`Error updating modality [${mod.id}]:`, updateErr);
    } else {
      count++;
    }
  }

  console.log(`\nSUCCESS: ${count} / ${modalities.length} database modalities successfully updated and harmonized!`);
}

cleanAndSeed();
