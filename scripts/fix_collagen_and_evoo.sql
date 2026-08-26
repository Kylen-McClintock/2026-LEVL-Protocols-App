-- ==============================================================================
-- FIX COLLAGEN PEPTIDES & EVOO DOSING SPECIFICATIONS
-- 1. Sets Collagen Peptides to Level 2 (oral dietary powder, not injectable)
-- 2. Sets Extra Virgin Olive Oil to mL units (15-30 mL / 1-2 tbsp)
-- ==============================================================================

-- 1. Update Collagen Peptides
UPDATE modalities
SET 
  effort_level = 'level_2',
  difficulty = 'Level 2 - Easy',
  category = 'Supplements & Nutraceuticals',
  modality_type = 'supplement',
  dose_or_exposure = '10g – 15g powder in water/smoothie',
  instructions = 'Step 1: Preparation — Mix 10g–15g of hydrolyzed collagen peptides powder with water, morning coffee, or smoothie (optionally pair with 500mg Vitamin C for optimal cross-linking).\nStep 2: Protocol Execution — Consume daily.\nStep 3: Completion — Log baseline observation shifts.'
WHERE id IN ('collagen_peptides', 'collagen_peptides_powder');

-- 2. Update Extra Virgin Olive Oil
UPDATE modalities
SET 
  dose_or_exposure = '15 mL – 30 mL (1-2 tablespoons)',
  relationships = jsonb_set(
    COALESCE(relationships, '{}'::jsonb),
    '{dosage_profile}',
    '{"unit": "mL", "starter_dose": 15, "recommended_dose": 30, "starter_notes": "15 mL (1 tbsp) daily with meal to assess tolerance.", "recommended_notes": "30 mL (2 tbsp) daily high-polyphenol EVOO.", "blueprint_notes": "30 mL – 45 mL daily Blueprint extra virgin olive oil."}'::jsonb
  )
WHERE id IN ('extra-virgin-olive-oil', 'evoo_high_polyphenol');
