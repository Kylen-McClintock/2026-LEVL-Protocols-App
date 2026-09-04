import { Protocol, ProtocolStep, Modality } from '@/lib/types'

// ==========================================
// SKIN LONGEVITY MODALITIES
// ==========================================

export const red_light_face_mask_modality: Modality = {
  id: 'red_light_face_mask',
  slug: 'red-light-face-mask',
  name: 'Red & Near-Infrared LED Face Mask (630nm / 830nm)',
  display_name: 'Red & NIR LED Mask (10 Mins • Bare Skin)',
  category: 'light',
  modality_type: 'photobiomodulation',
  status: 'active',
  brief_description: 'Photobiomodulation with dual 630nm red & 830nm near-infrared wavelengths to energize mitochondrial ATP and stimulate fibroblast pro-collagen synthesis.',
  expanded_why: 'Photobiomodulation delivers precise photon energy absorbed by cytochrome c oxidase in mitochondrial membranes, increasing ATP output and reactive oxygen species signaling to activate dermal fibroblasts. Clinical trials prove 630/830nm dual-frequency light significantly increases intradermal collagen density, reduces fine line volume, and improves skin roughness when applied on clean, bare skin (Wunsch & Matuschka, 2014).',
  headline_benefit: 'Mitochondrial ATP Stimulation & Dermal Collagen Proliferation',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Skin Firmness', 'Collagen Density', 'Erythema / Redness', 'Energy'],
  functional_outcomes_to_track: ['skin_clarity', 'energy', 'soreness'],
  dose_or_exposure: '10 Mins • Dual 630nm Red + 830nm NIR (~30–50 mW/cm² fluence)',
  timing_summary: 'Evening (on clean, completely bare skin before topical serums)',
  default_timing_slot: 'evening',
  frequency: '4x–5x weekly (Collagen & Recovery Cycle Days)',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Wunsch & Matuschka (2014) A Controlled Trial to Determine Efficacy of Red and Near-Infrared Light in Intradermal Collagen Density and Reduction of Fine Lines',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24286286/',
      type: 'pubmed'
    },
    {
      title: 'Avci et al. (2013) Low-level laser (light) therapy (LLLT) in skin: stimulating, healing, restoring',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24049929/',
      type: 'pubmed'
    }
  ]
}

export const topical_ghk_cu_serum_modality: Modality = {
  id: 'topical_ghk_cu_serum',
  slug: 'topical-ghk-cu-serum',
  name: 'Topical GHK-Cu Copper Tripeptide-1 Serum (1%–2%)',
  display_name: 'Topical GHK-Cu Copper Peptide Serum (3–4 Drops)',
  category: 'skincare',
  modality_type: 'peptide_topical',
  status: 'active',
  brief_description: 'Clinical copper tripeptide-1 serum applied post-red light to upregulate pro-collagen I, III, and decorin gene expression while firming dermal elasticity.',
  expanded_why: 'GHK-Cu (glycyl-L-histidyl-L-lysine copper) is a bioactive peptide with high affinity for Cu2+ ions. It upregulates dermal fibroblast mRNA for collagen I, collagen III, and decorin, inhibits matrix metalloproteinases (MMPs), and stimulates glycosaminoglycan synthesis. In clinical trials, topical copper peptide serum significantly increased collagen production compared to placebo and matched or exceeded tretinoin without causing retinoid dermatitis (Abdulghani et al., 1998; Pickart et al., 2018).',
  headline_benefit: 'Targeted Extracellular Matrix Remodeling & Fibroblast Gene Activation',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Skin Firmness', 'Collagen Density', 'Complexion Tone', 'Barrier Hydration'],
  functional_outcomes_to_track: ['skin_clarity', 'energy'],
  dose_or_exposure: '3–4 drops of 1.0%–2.0% GHK-Cu serum applied across face, neck, and chest',
  timing_summary: 'Evening (immediately following Red Light Mask session)',
  default_timing_slot: 'evening',
  frequency: '4x weekly (Skin-cycling collagen & recovery nights; avoid mixing with low-pH acids)',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Pickart & Margolina (2018) Regenerative and Protective Actions of the GHK-Cu Peptide in the Light of the New Gene Data',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29853961/',
      type: 'pubmed'
    },
    {
      title: 'Abdulghani et al. (1998) Effects of topical copper peptide cream compared with tretinoin on skin ultrastructure',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10188147/',
      type: 'pubmed'
    }
  ]
}

export const micro_retinoid_tretinoin_modality: Modality = {
  id: 'micro_retinoid_tretinoin',
  slug: 'micro-retinoid-tretinoin',
  name: 'Micro-Encapsulated Retinoid (Tretinoin 0.025% / Retinal)',
  display_name: 'Micro-Retinoid (Pea-Sized Amount • Night 2)',
  category: 'skincare',
  modality_type: 'retinoid',
  status: 'active',
  brief_description: 'Pure retinoic acid receptor agonist that speeds stratum corneum cellular turnover, unclogs pores, and reverses solar elastosis.',
  expanded_why: 'Tretinoin (all-trans retinoic acid) binds to nuclear retinoic acid receptors (RARs), increasing transcription of procollagen genes and suppressing ultraviolet-induced matrix metalloproteinases. Micro-encapsulation ensures slow dermal release over 8 hours, minimizing erythema and peeling. Cycled on dedicated evenings away from GHK-Cu to prevent chemical oxidation (Kligman et al., 1986).',
  headline_benefit: 'Accelerated Stratum Corneum Cellular Turnover & Wrinkle Reversal',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Skin Firmness', 'Complexion Tone', 'Pore Refinement'],
  functional_outcomes_to_track: ['skin_clarity'],
  dose_or_exposure: 'Pea-sized dab (0.025%–0.05%) applied to completely dry skin',
  timing_summary: 'Night (Retinoid cycling nights only; follow with ceramide moisturizer)',
  default_timing_slot: 'bedtime',
  frequency: '2x weekly (Skin Cycling Night 2)',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Kligman et al. (1986) Topical tretinoin for photoaged skin',
      url: 'https://pubmed.ncbi.nlm.nih.gov/3517830/',
      type: 'pubmed'
    }
  ]
}

export const antioxidant_vitamin_c_ferulic_modality: Modality = {
  id: 'antioxidant_vitamin_c_ferulic',
  slug: 'antioxidant-vitamin-c-ferulic',
  name: 'Antioxidant Serum (15% L-Ascorbic Acid + 1% E + Ferulic)',
  display_name: 'Antioxidant C+E+Ferulic Serum (4–5 Drops)',
  category: 'skincare',
  modality_type: 'antioxidant',
  status: 'active',
  brief_description: 'Gold-standard morning antioxidant complex that neutralizes singlet oxygen, free radicals, and environmental photo-damage.',
  expanded_why: '15% pure L-ascorbic acid formulated at pH < 3.5 paired with 1% alpha-tocopherol and 0.5% ferulic acid provides an eight-fold photoprotective barrier against solar radiation and ozone oxidation. Kept exclusively in the morning routine to prevent chemical degradation of evening copper peptides (Pinnell et al., 2001; Lin et al., 2005).',
  headline_benefit: 'Eight-Fold Environmental Free Radical & Singlet Oxygen Defense',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Complexion Tone', 'Skin Firmness'],
  functional_outcomes_to_track: ['skin_clarity'],
  dose_or_exposure: '4–5 drops pressed into freshly cleansed, dry morning skin',
  timing_summary: 'Morning (first layer directly following morning rinse)',
  default_timing_slot: 'morning',
  frequency: 'Daily (365 days/year)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Lin et al. (2005) Ferulic acid stabilizes a solution of vitamins C and E and doubles its photoprotection of skin',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16185284/',
      type: 'pubmed'
    }
  ]
}

export const mineral_sunscreen_spf50_modality: Modality = {
  id: 'mineral_sunscreen_spf50',
  slug: 'mineral-sunscreen-spf50',
  name: 'Broad-Spectrum Mineral Sunscreen (Zinc Oxide SPF 50+ PA++++)',
  display_name: 'Mineral SPF 50+ Sunscreen (Two Finger Lengths)',
  category: 'skincare',
  modality_type: 'sunscreen',
  status: 'active',
  brief_description: 'Non-nano 20%+ zinc oxide physical photoprotection blocking 98%+ of UVA/UVB rays to halt solar elastosis and photoaging.',
  expanded_why: 'Ultraviolet radiation is responsible for 80%–90% of visible skin aging (photoaging). Non-nano zinc oxide reflects and scatters ultraviolet wavelengths across UVA I, UVA II, and UVB spectrums without generating systemic endocrine disruption. Daily application is proven in randomized trials to slow or reverse micro-aging markers over 4.5 years (Hughes et al., 2013).',
  headline_benefit: 'Non-Chemical Physical Shield Against Photoaging & Collagen Degradation',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Skin Firmness', 'Collagen Density'],
  functional_outcomes_to_track: ['skin_clarity'],
  dose_or_exposure: '1/4 teaspoon (approx 2 finger lengths) applied to face, ears, and neck',
  timing_summary: 'Morning (final step of morning routine before daylight exposure)',
  default_timing_slot: 'morning',
  frequency: 'Daily (365 days/year regardless of cloud cover)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Hughes et al. (2013) Sunscreen and prevention of skin aging: a randomized trial',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23732711/',
      type: 'pubmed'
    }
  ]
}

export const ceramide_ectoin_barrier_cream_modality: Modality = {
  id: 'ceramide_ectoin_barrier_cream',
  slug: 'ceramide-ectoin-barrier-cream',
  name: 'Ceramide NP & Ectoin Barrier Recovery Cream',
  display_name: 'Ceramide & Ectoin Barrier Cream (1 Pump)',
  category: 'skincare',
  modality_type: 'moisturizer',
  status: 'active',
  brief_description: 'Physiological lipid matrix (Ceramides NP/AP/EOP + Ectoin + Squalane) that locks in cellular hydration and prevents transepidermal water loss.',
  expanded_why: 'Replenishing stratum corneum intercellular lipids with a 3:1:1 physiological ratio of ceramides, cholesterol, and free fatty acids restores barrier permeability, prevents transepidermal water loss (TEWL), and shields cellular membranes from osmotic stress. Critical for buffering active retinoids and peptides (Draelos et al., 2018).',
  headline_benefit: 'Stratum Corneum Lipid Matrix Restoration & Moisture Locking',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Barrier Hydration', 'Erythema / Redness'],
  functional_outcomes_to_track: ['skin_clarity'],
  dose_or_exposure: '1–2 pumps smoothed over face and neck as final evening seal',
  timing_summary: 'Night (and morning as needed for dry/compromised skin)',
  default_timing_slot: 'bedtime',
  frequency: 'Daily (Morning & Night)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Draelos et al. (2018) The effect of a ceramide-containing cleanser and moisturizer on skin barrier repair in dry skin',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30130026/',
      type: 'pubmed'
    }
  ]
}

export const hydrolyzed_collagen_peptides_modality: Modality = {
  id: 'hydrolyzed_collagen_peptides',
  slug: 'hydrolyzed-collagen-peptides',
  name: 'Hydrolyzed Collagen Peptides (10g–15g) + Vitamin C',
  display_name: 'Hydrolyzed Collagen Peptides (10g–15g Midday)',
  category: 'supplement',
  modality_type: 'nutraceutical',
  status: 'active',
  brief_description: 'Oral bioactive collagen hydrolysate supplying direct proline, hydroxyproline, and glycine amino acid building blocks for dermal matrix synthesis.',
  expanded_why: 'Double-blind, placebo-controlled clinical trials document that 10g oral collagen peptides daily for 8–12 weeks significantly increases dermal collagen density, reduces skin fragmentation, and elevates skin hydration and elasticity (Proksch et al., 2014; Asserin et al., 2015). Pairing with 500mg Vitamin C ensures proper enzymatic proline hydroxylation.',
  headline_benefit: 'Systemic Pro-Collagen Amino Acid Delivery for Dermal Thickness',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Skin Firmness', 'Joint Comfort', 'Collagen Density'],
  functional_outcomes_to_track: ['skin_clarity', 'joint_comfort'],
  dose_or_exposure: '10g–15g hydrolyzed collagen powder dissolved in warm water or tea + 500mg Vitamin C',
  timing_summary: 'Afternoon / Midday (with first meal or beverage)',
  default_timing_slot: 'afternoon',
  frequency: 'Daily',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Proksch et al. (2014) Oral supplementation of specific collagen peptides has beneficial effects on human skin physiology',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24401291/',
      type: 'pubmed'
    }
  ]
}

export const ALL_BUILT_IN_SKIN_MODALITIES: Modality[] = [
  red_light_face_mask_modality,
  topical_ghk_cu_serum_modality,
  micro_retinoid_tretinoin_modality,
  antioxidant_vitamin_c_ferulic_modality,
  mineral_sunscreen_spf50_modality,
  ceramide_ectoin_barrier_cream_modality,
  hydrolyzed_collagen_peptides_modality
]

// ==========================================
// CELLULAR DERMAL MATRIX & SKIN CYCLING PROTOCOL
// ==========================================

export const CELLULAR_DERMAL_MATRIX_PROTOCOL: Protocol & { steps: ProtocolStep[] } = {
  id: 'cellular_dermal_matrix',
  slug: 'cellular-dermal-matrix',
  name: 'Cellular Dermal Matrix & Skin Cycling Protocol',
  author_name: 'Dermatology & Longevity Medicine Consensus',
  source_label: 'Dermatological Consensus',
  protocol_type: 'expert_created',
  primary_goal: 'Intradermal Collagen Density & Skin Longevity',
  secondary_goals: ['Skin Firmness', 'Wrinkle Reversal', 'Photoprotection', 'Extracellular Matrix Rebuilding'],
  difficulty_level: 'Intermediate',
  evidence_level: 'High (Clinical Trials)',
  safety_level: 'High',
  status: 'active',
  description: 'The premier anti-aging skincare protocol: Photobiomodulation (630nm/830nm LED mask) paired synergistically with topical GHK-Cu copper peptides, micro-retinoids, and 4-day skin cycling for maximum collagen density without barrier irritation.',
  rationale: 'Skin aging is driven by mitochondrial ATP decline, solar photo-damage (solar elastosis), and matrix metalloproteinase collagen fragmentation. This protocol leverages the clinically proven synergy between Red Light Photobiomodulation (mitochondrial energy production) and GHK-Cu Copper Tripeptide-1 (fibroblast gene activation), organized into a 4-night skin cycling schedule to maximize dermal thickness while preventing retinoid dermatitis.',
  steps: [
    {
      id: 'step_skin_am_antioxidant',
      protocol_id: 'cellular_dermal_matrix',
      modality_id: 'antioxidant_vitamin_c_ferulic',
      ordering_index: 1,
      display_order: 1,
      instructions: 'Morning Antioxidant Shield (C+E+Ferulic)',
      timing_slot: 'morning',
      dose_text: '4–5 drops on clean dry face',
      notes: 'Step 1 AM: Press gently into skin; wait 60 seconds before applying moisturizer and sunscreen.',
      modality: antioxidant_vitamin_c_ferulic_modality
    },
    {
      id: 'step_skin_am_sunscreen',
      protocol_id: 'cellular_dermal_matrix',
      modality_id: 'mineral_sunscreen_spf50',
      ordering_index: 2,
      display_order: 2,
      instructions: 'Broad-Spectrum Mineral Sunscreen (Zinc Oxide SPF 50+)',
      timing_slot: 'morning',
      dose_text: 'Two finger lengths (1/4 tsp)',
      notes: 'Step 2 AM: Apply 15 minutes before daylight exposure. Primary defense against photoaging.',
      modality: mineral_sunscreen_spf50_modality
    },
    {
      id: 'step_skin_midday_collagen',
      protocol_id: 'cellular_dermal_matrix',
      modality_id: 'hydrolyzed_collagen_peptides',
      ordering_index: 3,
      display_order: 3,
      instructions: 'Oral Hydrolyzed Collagen Peptides + Vitamin C',
      timing_slot: 'afternoon',
      dose_text: '10g–15g peptides + 500mg Vitamin C',
      notes: 'Afternoon: Mix in tea or water with midday meal. Supplies systemic amino acid building blocks.',
      modality: hydrolyzed_collagen_peptides_modality
    },
    {
      id: 'step_skin_pm_red_light',
      protocol_id: 'cellular_dermal_matrix',
      modality_id: 'red_light_face_mask',
      ordering_index: 4,
      display_order: 4,
      instructions: 'Red & Near-Infrared LED Face Mask (10 Mins)',
      timing_slot: 'evening',
      dose_text: '10 mins (630nm + 830nm)',
      notes: 'Step 1 Evening: Cleanse face and pat completely dry. Use on 100% bare skin (creams block photons). Optional: Open Timer Applet.',
      modality: red_light_face_mask_modality
    },
    {
      id: 'step_skin_pm_ghk_cu',
      protocol_id: 'cellular_dermal_matrix',
      modality_id: 'topical_ghk_cu_serum',
      ordering_index: 5,
      display_order: 5,
      instructions: 'Topical GHK-Cu Copper Tripeptide-1 Serum',
      timing_slot: 'evening',
      dose_text: '3–4 drops',
      notes: 'Step 2 Evening: Apply immediately after Red Light session while dermal micro-circulation is elevated. Avoid mixing with low-pH acids.',
      modality: topical_ghk_cu_serum_modality
    },
    {
      id: 'step_skin_night_retinoid',
      protocol_id: 'cellular_dermal_matrix',
      modality_id: 'micro_retinoid_tretinoin',
      ordering_index: 6,
      display_order: 6,
      instructions: 'Micro-Encapsulated Retinoid (Tretinoin 0.025%)',
      timing_slot: 'bedtime',
      dose_text: 'Pea-sized dab',
      notes: 'Night 2 of 4-day cycle: Apply on retinoid night only. Avoid applying GHK-Cu on this night to prevent chemical interference.',
      modality: micro_retinoid_tretinoin_modality
    },
    {
      id: 'step_skin_night_barrier_cream',
      protocol_id: 'cellular_dermal_matrix',
      modality_id: 'ceramide_ectoin_barrier_cream',
      ordering_index: 7,
      display_order: 7,
      instructions: 'Ceramide NP & Ectoin Barrier Recovery Cream',
      timing_slot: 'bedtime',
      dose_text: '1–2 pumps',
      notes: 'Final step: Locks in hydration, reinforces stratum corneum barrier, and soothes active ingredients.',
      modality: ceramide_ectoin_barrier_cream_modality
    }
  ]
}

export const BUILT_IN_SKIN_PROTOCOLS: (Protocol & { steps: ProtocolStep[] })[] = [
  CELLULAR_DERMAL_MATRIX_PROTOCOL
]
