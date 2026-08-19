-- Migration: 0010_spell_out_acronyms.sql
-- Rule: Any modality with an acronym must have it spelled out in its description.

UPDATE modalities SET brief_description = 'Hyperbaric Oxygen Therapy (HBOT) - ' || brief_description WHERE id = 'hyperbaric_oxygen_therapy_hbot' AND brief_description NOT ILIKE '%Hyperbaric Oxygen Therapy%';
UPDATE modalities SET brief_description = 'Maximal Oxygen Consumption (VO2 Max) - ' || brief_description WHERE id = 'vo2_max_hiit_training' AND brief_description NOT ILIKE '%Maximal Oxygen Consumption%';
UPDATE modalities SET brief_description = 'Nicotinamide Adenine Dinucleotide (NAD+) - ' || brief_description WHERE id = 'nad_iv_therapy' AND brief_description NOT ILIKE '%Nicotinamide Adenine Dinucleotide%';
UPDATE modalities SET brief_description = 'Nicotinamide Adenine Dinucleotide (NAD+) - ' || brief_description WHERE id = 'nad_precursors' AND brief_description NOT ILIKE '%Nicotinamide Adenine Dinucleotide%';
UPDATE modalities SET brief_description = 'Alpha-Ketoglutarate (AKG) - ' || brief_description WHERE id = 'alpha_ketoglutarate_akg' AND brief_description NOT ILIKE '%Alpha-Ketoglutarate%';
UPDATE modalities SET brief_description = 'N-Acetyl Cysteine (NAC) - ' || brief_description WHERE id = 'n_acetyl_cysteine_nac' AND brief_description NOT ILIKE '%N-Acetyl Cysteine%';
UPDATE modalities SET brief_description = 'Dual-Energy X-ray Absorptiometry (DEXA) - ' || brief_description WHERE id = 'dexa_scan' AND brief_description NOT ILIKE '%Dual-Energy X-ray Absorptiometry%';
UPDATE modalities SET brief_description = 'Continuous Glucose Monitor (CGM) - ' || brief_description WHERE id = 'continuous_glucose_monitor' AND brief_description NOT ILIKE '%Continuous Glucose Monitor%';
UPDATE modalities SET brief_description = 'Eicosapentaenoic Acid / Docosahexaenoic Acid (EPA/DHA) - ' || brief_description WHERE id = 'epa_dha_omega3' AND brief_description NOT ILIKE '%Eicosapentaenoic Acid%';
UPDATE modalities SET brief_description = 'Glucagon-Like Peptide-1 (GLP-1) - ' || brief_description WHERE id = 'glp_1_receptor_agonists' AND brief_description NOT ILIKE '%Glucagon-Like Peptide-1%';
UPDATE modalities SET brief_description = 'Nicotinamide Mononucleotide (NMN) - ' || brief_description WHERE id = 'nmn' AND brief_description NOT ILIKE '%Nicotinamide Mononucleotide%';
UPDATE modalities SET brief_description = 'Blood Flow Restriction (BFR) - ' || brief_description WHERE id = 'bfr_training' AND brief_description NOT ILIKE '%Blood Flow Restriction%';
UPDATE modalities SET brief_description = 'Coenzyme Q10 (CoQ10) - ' || brief_description WHERE id = 'coq10' AND brief_description NOT ILIKE '%Coenzyme Q10%';

-- From the new 20 modalities:
UPDATE modalities SET brief_description = 'Alpha-Lipoic Acid (ALA) - ' || brief_description WHERE id = 'alpha_lipoic_acid' AND brief_description NOT ILIKE '%Alpha-Lipoic Acid%';
UPDATE modalities SET brief_description = 'Menaquinone-7 (MK-7) - ' || brief_description WHERE id = 'vitamin_k2_mk7' AND brief_description NOT ILIKE '%Menaquinone-7%';
UPDATE modalities SET brief_description = 'Alpha-Glycerophosphocholine (Alpha-GPC) - ' || brief_description WHERE id = 'alpha_gpc' AND brief_description NOT ILIKE '%Alpha-Glycerophosphocholine%';
UPDATE modalities SET brief_description = 'Gamma-Aminobutyric Acid (GABA) - ' || brief_description WHERE id = 'gaba' AND brief_description NOT ILIKE '%Gamma-Aminobutyric Acid%';
UPDATE modalities SET brief_description = 'Tauroursodeoxycholic Acid (TUDCA) - ' || brief_description WHERE id = 'tudca' AND brief_description NOT ILIKE '%Tauroursodeoxycholic Acid%';
