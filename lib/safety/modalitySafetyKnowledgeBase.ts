import { Modality } from '@/lib/types'

export type SafetyRiskLevel = 'high_safety' | 'low_risk' | 'moderate_risk' | 'high_risk'

export interface ModalitySafetyProfile {
  riskLevel: SafetyRiskLevel
  riskLevelLabel: string
  riskBadgeClass: string
  safetySummary: string
  importantConsiderations: string[]
  documentedContraindications: string[]
  commonSideEffects: {
    effect: string
    mitigation: string
  }[]
}

/**
 * Normalizes modality name / slug for archetype matching
 */
function normalizeKey(str?: string | null): string {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Curated knowledge base of clinical safety profiles, crucial considerations, 
 * contraindications, and actionable adverse effect mitigations.
 */
export function getModalitySafetyProfile(modality?: Modality | null): ModalitySafetyProfile {
  if (!modality) {
    return {
      riskLevel: 'high_safety',
      riskLevelLabel: 'High Safety Profile',
      riskBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      safetySummary: 'General public wellness habit with minimal physiological risk when practiced moderately.',
      importantConsiderations: [
        'Listen to your body and discontinue immediately if experiencing acute pain, dizziness, or distress.',
        'Stay adequately hydrated and maintain regular sleep habits.'
      ],
      documentedContraindications: [],
      commonSideEffects: []
    }
  }

  const key = normalizeKey(`${modality.id || ''} ${modality.slug || ''} ${modality.name || ''} ${modality.display_name || ''}`)
  const category = (modality.category || '').toLowerCase()
  const modType = (modality.modality_type || '').toLowerCase()
  const rawContra = Array.isArray(modality.contraindications) ? modality.contraindications : []

  // 1. COLD PLUNGE / COLD WATER IMMERSION / CRYO
  if (key.includes('coldplunge') || key.includes('coldwater') || key.includes('icebath') || key.includes('cryo') || key.includes('deliberatecold')) {
    return {
      riskLevel: 'moderate_risk',
      riskLevelLabel: 'Moderate Caution / Thermal Stress',
      riskBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      safetySummary: 'Potent autonomic and endocrine stimulus. Triggers an acute cold shock gasp response, peripheral vasoconstriction, and a ~250% norepinephrine surge.',
      importantConsiderations: [
        'Never plunge alone or without supervision during your first several sessions: Cold shock induces an involuntary gasp reflex and rapid hyperventilation. Having a partner present ensures safety until your autonomic shock tolerance is established.',
        'Never hyperventilate prior to entering the water: Avoid Wim Hof breathing or rapid hyperventilation before or during immersion to prevent shallow water blackout (loss of consciousness in water).',
        'Søberg Principle natural warm-up: Exit the cold and reheat naturally through movement (e.g. horse stance, walking, or air drying) rather than immediately jumping into a hot shower or sauna. Forcing the body to reheat on its own maximizes brown adipose tissue (BAT) mitochondrial uncoupling and sustained metabolic thermogenesis.',
        'Strength training separation: Delay cold immersion by at least 4 hours after resistance training (or perform on rest/cardio days). Cold water immersion immediately post-workout constricts blood vessels and blunts the inflammatory signaling (mTORC1) required for muscle hypertrophy.',
        'Exit immediately if shivering becomes uncontrollable, if you experience mental confusion, or if you lose feeling in your extremities.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        'Uncontrolled Hypertension or Recent Myocardial Infarction',
        'Cardiac Arrhythmias or Long QT Syndrome',
        'Active Pregnancy (due to abrupt hemodynamic pressor shifts)',
        'Severe Raynaud’s Phenomenon or Peripheral Neuropathy',
        'Cold Urticaria (systemic histamine reaction to cold)'
      ],
      commonSideEffects: [
        {
          effect: 'Involuntary hyperventilation / cold gasp',
          mitigation: 'Step in slowly up to chest, focus on a long, slow 6-second nasal exhale to reset vagal tone within 20 seconds.'
        },
        {
          effect: 'Post-drop (continued core temperature decline after exiting)',
          mitigation: 'Dry off promptly, put on warm dry layers (socks/beanie), and engage in light continuous movement.'
        },
        {
          effect: 'Orthostatic lightheadedness upon standing up',
          mitigation: 'Pause for 10–15 seconds sitting on the tub ledge before standing upright to let blood pressure equalize.'
        }
      ]
    }
  }

  // 2. COLD SHOWER
  if (key.includes('coldshower')) {
    return {
      riskLevel: 'high_safety',
      riskLevelLabel: 'High Safety / Cutaneous Cold',
      riskBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      safetySummary: 'Cutaneous cold exposure without the hydrostatic pressure of full submersion. Safe for nearly all healthy adults.',
      importantConsiderations: [
        'Ease in gradually: Start with warm water and turn the dial fully cold for the final 30–60 seconds, working up to 2–3 minutes.',
        'Keep breathing continuous: Avoid holding your breath when the cold water first strikes your chest and upper back.',
        'Avoid turning water to freezing extremes if experiencing acute illness, vertigo, or fever.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        'Severe cold urticaria',
        'Uncontrolled severe cardiac arrhythmias'
      ],
      commonSideEffects: [
        {
          effect: 'Skin redness and transient shivering',
          mitigation: 'Normal reactive vasodilation. Dry off vigorously with a towel to stimulate microcirculation.'
        }
      ]
    }
  }

  // 3. SAUNA / INFRARED SAUNA / HEAT THERAPY
  if (key.includes('sauna') || key.includes('heat') || key.includes('hypertherm')) {
    return {
      riskLevel: 'moderate_risk',
      riskLevelLabel: 'Moderate Caution / Cardiovascular Load',
      riskBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      safetySummary: 'Simulates moderate cardiovascular exercise with heart rates reaching 120–150 bpm and heavy sweat loss (up to 1 liter per session).',
      importantConsiderations: [
        'Never use sauna under the influence of alcohol or sedatives: Alcohol blunts normal hemodynamic autoregulation and dramatically amplifies the risk of fatal heat exhaustion, syncope, and cardiac arrhythmias.',
        'Hydration & electrolyte rule: Drink at least 16–24 oz of water with sodium and potassium before and immediately after any 15–20 minute session.',
        'Sit upright for 1–2 minutes before exiting: Rapidly standing up from a lying bench position in 174°F+ heat causes sudden venous pooling in the legs and orthostatic fainting.',
        'Exit immediately if you experience dizziness, lightheadedness, nausea, or a throbbing headache.',
        'Do not exceed 20 minutes per session without an active cooling break.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        'Unstable Angina or Recent Myocardial Infarction',
        'Severe Aortic Valve Stenosis',
        'Active Fever, Infection, or Acute Dehydration',
        'Pregnancy (fetal thermal sensitivity in first trimester)',
        'Orthostatic Hypotension or Postural Orthostatic Tachycardia (POTS)'
      ],
      commonSideEffects: [
        {
          effect: 'Lightheadedness upon standing (orthostatic hypotension)',
          mitigation: 'Move to the lowest bench for the final 2 minutes, sit upright, and stand up very slowly.'
        },
        {
          effect: 'Mild dehydration headache or muscle cramps',
          mitigation: 'Consume 500mg sodium + 200mg potassium in electrolyte water post-session.'
        }
      ]
    }
  }

  // 4. BREATHWORK (CYCLIC HYPERVENTILATION / WIM HOF)
  if (key.includes('hyperventilation') || key.includes('wimhof') || key.includes('tummo')) {
    return {
      riskLevel: 'moderate_risk',
      riskLevelLabel: 'Moderate Caution / Hypocapnic Shift',
      riskBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      safetySummary: 'Vigorous cyclic hyperventilation significantly drives down arterial CO2 (hypocapnia), causing cerebral vasoconstriction and prolonged breath retention.',
      importantConsiderations: [
        'NEVER practice in or near water, in the bath, or while driving: Breath retention following hyperventilation can cause sudden, warning-free loss of consciousness (shallow water blackout) resulting in drowning.',
        'Always practice seated or lying down on a soft, secure surface (bed, yoga mat, couch).',
        'Do not force retention past the first urge to breathe: Competitive breath-holding increases hypoxia without additional hormetic benefit.',
        'Tingling in fingers/lips and mild tetany (carpopedal spasm) are normal physiological responses to acute respiratory alkalosis, but stop if feeling distressed.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        'History of Epilepsy, Seizures, or Unexplained Fainting',
        'Active Pregnancy (due to transient fetal hypoxia)',
        'Uncontrolled Hypertension or Aneurysm Risk',
        'Severe Cardiovascular Disease'
      ],
      commonSideEffects: [
        {
          effect: 'Extremity tingling, lightheadedness, or ringing in ears',
          mitigation: 'Return to normal gentle nasal breathing immediately; sensations subside within 60–90 seconds.'
        }
      ]
    }
  }

  // 5. GENTLE BREATHWORK (BOX BREATHING / 4-7-8 / COHERENT / NSDR)
  if (key.includes('boxbreath') || key.includes('478') || key.includes('coherent') || key.includes('nsdr') || key.includes('yoganidra') || key.includes('cyclicsigh')) {
    return {
      riskLevel: 'high_safety',
      riskLevelLabel: 'High Safety / Parasympathetic',
      riskBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      safetySummary: 'Exceptionally safe autonomic regulation. Stimulates the vagus nerve to lower heart rate and reduce salivary cortisol with zero chemical or physical hazards.',
      importantConsiderations: [
        'Do not perform 4-7-8 breathing while driving or operating machinery if prone to drowsiness.',
        'Maintain relaxed nasal breathing without straining your diaphragm or forcing exhalations.',
        'If you feel slightly lightheaded during extended breath-holds (e.g. 7-second hold in 4-7-8), shorten the duration to a comfortable 4-4-4 or 2-4-4 rhythm.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        'Severe acute respiratory distress or acute asthma attack (use prescribed rescue inhaler instead)'
      ],
      commonSideEffects: [
        {
          effect: 'Deep drowsiness or sudden yawn reflex',
          mitigation: 'Intended parasympathetic response. Practice in a comfortable chair or before sleep.'
        }
      ]
    }
  }

  // 6. HIGH-INTENSITY INTERVAL TRAINING / VO2 MAX (NORWEGIAN 4X4, ZONE 5)
  if (key.includes('norwegian') || key.includes('4x4') || key.includes('vo2max') || key.includes('zone5') || key.includes('hiit') || key.includes('sprint')) {
    return {
      riskLevel: 'moderate_risk',
      riskLevelLabel: 'Moderate Caution / Peak Exertion',
      riskBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      safetySummary: 'Pushes cardiac output to 90–95% HR_max to drive eccentric left ventricular hypertrophy and VO2 max expansion.',
      importantConsiderations: [
        'Establish an aerobic foundation first: Complete at least 4–6 weeks of consistent Zone 2 aerobic base before introducing maximal 4x4 intervals.',
        'Always include an active 10-minute warm-up and 5-minute cool-down: Sudden maximal sprinting without a warm-up spikes arrhythmia risk and hamstring/calf strains.',
        'Do not perform when severely sleep deprived (<5 hours) or during active viral infection: Acute cardiac stress in an immune-compromised state increases myocarditis risk.',
        'Stop immediately if experiencing crushing chest pressure, radiating pain in the jaw/arm, or uncharacteristic shortness of breath.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        'Uncontrolled Hypertension (Resting BP > 160/100 mmHg)',
        'Known Coronary Artery Disease or Unstable Angina',
        'Recent Cardiac Stent or Heart Surgery (<6 months without clearance)',
        'Acute Musculoskeletal Injury'
      ],
      commonSideEffects: [
        {
          effect: 'Nausea or post-interval dizziness',
          mitigation: 'Do not sit down immediately; walk slowly for 3 minutes to maintain the muscular pump and prevent venous pooling.'
        },
        {
          effect: 'Delayed Onset Muscle Soreness (DOMS)',
          mitigation: 'Follow with light active recovery (Zone 1 walking) and adequate dietary protein (1.6–2.2g/kg).'
        }
      ]
    }
  }

  // 7. EXTENDED & INTERMITTENT FASTING (16:8, 24H, 36H, 72H)
  if (key.includes('fasting') || key.includes('timerestricted') || key.includes('trf') || key.includes('autophagy') || key.includes('waterfast')) {
    return {
      riskLevel: 'moderate_risk',
      riskLevelLabel: 'Moderate Caution / Metabolic Shift',
      riskBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      safetySummary: 'Depletes hepatic glycogen, suppresses systemic insulin/IGF-1, and activates macroautophagy and AMPK signaling.',
      importantConsiderations: [
        'Mandatory electrolyte supplementation on fasts >16 hours: Sodium (2,000–3,000mg), potassium (1,000mg), and magnesium (300mg) prevent the "keto flu", orthostatic fainting, and heart palpitations caused by renal sodium dumping.',
        'Break fasts gently: Do not break a fast exceeding 24 hours with high-glycemic carbs or massive fat meals. Reintroduce warm bone broth, cooked vegetables, and lean protein to avoid gastric cramps.',
        'Maintain hydration: Drink 80–100 oz of water daily.',
        'Discontinue fast immediately if experiencing persistent dizziness, cognitive confusion, severe nausea, or cardiac flutter.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        'History of Anorexia, Bulimia, or Eating Disorders',
        'Type 1 Diabetes or Insulin-Dependent Type 2 Diabetes (risk of severe hypoglycemia/DKA without medical titration)',
        'Active Pregnancy or Breastfeeding',
        'Underweight (BMI < 18.5)',
        'Children and Adolescents under 18'
      ],
      commonSideEffects: [
        {
          effect: 'Hunger pangs and ghrelin spikes (typically at regular meal times)',
          mitigation: 'Drink sparkling mineral water, black coffee, or plain green tea; ghrelin waves naturally recede within 20–30 minutes.'
        },
        {
          effect: 'Orthostatic lightheadedness upon standing up',
          mitigation: 'Dissolve 1/4 tsp of Celtic sea salt or sodium electrolytes under the tongue.'
        }
      ]
    }
  }

  // 8. PEPTIDES & SUBQ INJECTIONS (BPC-157, TB-500, CJC/IPAMORELIN, EPITALON, GHK-CU)
  if (category.includes('peptide') || modType.includes('peptide') || key.includes('bpc157') || key.includes('tb500') || key.includes('cjc') || key.includes('ipamorelin') || key.includes('epitalon') || key.includes('ghkcu')) {
    return {
      riskLevel: 'moderate_risk',
      riskLevelLabel: 'Prescription / Clinical Oversight',
      riskBadgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      safetySummary: 'Bioactive signaling peptides administered via subcutaneous injection. High specificity for cellular repair, collagen synthesis, and growth hormone release.',
      importantConsiderations: [
        'Aseptic SubQ technique: Always use fresh, sterile, single-use 31G insulin syringes and wipe the vial stopper and injection site with 70% isopropyl alcohol.',
        'Bacteriostatic storage: Reconstitute only with sterile bacteriostatic water (0.9% benzyl alcohol). Store refrigerated at 36°F–46°F (2°C–8°C) and discard reconstituted vials past 28–30 days.',
        'Active malignancy screen: Peptides with angiogenic properties (like BPC-157/TB-500) or GH secretagogues should never be used by individuals with active cancers or history of unregulated cell proliferation.',
        'Cycle adherence: Respect recommended cycle durations (typically 8–12 weeks on, followed by 4–6 weeks off) to prevent receptor downregulation and maintain physiological sensitivity.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        'Active Malignancy, Cancer History, or Neoplastic Disease',
        'Pregnancy or Nursing',
        'Known Hypersensitivity to Specific Peptide Sequence',
        'Concurrent Unmanaged Pituitary or Endocrine Tumors'
      ],
      commonSideEffects: [
        {
          effect: 'Mild transient injection site erythema (redness/itch)',
          mitigation: 'Ensure alcohol has completely dried on skin before injection; rotate injection sites across abdominal quadrants.'
        },
        {
          effect: 'Transient flushing or head rush post-injection (GH secretagogues)',
          mitigation: 'Normal acute somatotropic signaling; administer while seated directly before bedtime.'
        }
      ]
    }
  }

  // 9. SUPPLEMENTS (CREATINE, CURCUMIN, ASHWAGANDHA, NIACIN, FISETIN, RAPAMYCIN)
  if (category.includes('nutrition') || modType.includes('supplement') || key.includes('creatine') || key.includes('curcumin') || key.includes('ashwagandha') || key.includes('niacin') || key.includes('fisetin') || key.includes('rapamycin') || key.includes('omega3')) {
    const isCreatine = key.includes('creatine')
    const isNiacin = key.includes('niacin')
    const isCurcuminOrFishOil = key.includes('curcumin') || key.includes('omega') || key.includes('fishoil')
    const isAshwagandha = key.includes('ashwagandha')
    const isFisetin = key.includes('fisetin') || key.includes('quercetin')

    return {
      riskLevel: 'high_safety',
      riskLevelLabel: 'High Safety / Evidence Grade A',
      riskBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      safetySummary: 'Extensively studied nutraceutical compounds with established clinical safety margins and FDA GRAS status.',
      importantConsiderations: [
        isCreatine 
          ? 'Maintain hydration: Creatine increases cellular water uptake into muscle tissue; drink at least 80–100 oz of water daily. Note that blood tests may show benign, transient elevations in serum creatinine without true renal dysfunction.'
          : isNiacin
          ? 'Prostaglandin flushing is harmless: Nicotinic acid causes cutaneous vasodilation (warmth, tingling, redness) lasting 20–45 minutes. Take with a substantial meal or split the dose to minimize intensity.'
          : isCurcuminOrFishOil
          ? 'Mild anticoagulant synergy: High doses have mild antiplatelet effects. Discontinue 1–2 weeks prior to scheduled surgery or consult your physician if taking prescription blood-thinners (Warfarin, Eliquis).'
          : isAshwagandha
          ? 'Cycle duration: Use for 8–12 weeks followed by a 2–4 week washout period to avoid thyroid overstimulation and emotional blunting.'
          : isFisetin
          ? 'Lipid co-ingestion required: Senolytic flavonoids (Fisetin, Quercetin) are lipophilic. Always consume with dietary fats (e.g. 1 tbsp extra virgin olive oil or full-fat yogurt) to ensure adequate micellar absorption.'
          : 'Take with meals unless specifically instructed to take on an empty stomach to minimize gastrointestinal discomfort.',
        'Do not exceed recommended clinical doses without medical supervision.',
        'Review current prescription medications for potential cytochrome P450 (CYP3A4/CYP2C9) liver enzyme competition.'
      ],
      documentedContraindications: rawContra.length > 0 ? rawContra : [
        isCreatine ? 'Pre-existing Severe Renal Impairment (eGFR < 30)' :
        isCurcuminOrFishOil ? 'Bleeding Disorders or Concurrent High-Dose Anticoagulants' :
        isAshwagandha ? 'Hyperthyroidism, Hashimoto’s flare, or Autoimmune Disease' :
        'Known allergy to formulation ingredients'
      ],
      commonSideEffects: [
        {
          effect: isCreatine ? 'Mild initial stomach cramping if taken without water' :
                  isNiacin ? 'Cutaneous flushing and skin warmth' :
                  'Mild gastrointestinal upset',
          mitigation: isCreatine ? 'Dissolve completely in warm water or split 5g into two 2.5g doses taken with meals.' :
                      isNiacin ? 'Take with food or switch to sustained-release form after physician clearance.' :
                      'Take with a balanced meal and a full glass of water.'
        }
      ]
    }
  }

  // 10. FALLBACK GENERIC PROTOCOL MODALITY
  return {
    riskLevel: (modality.safety_level as SafetyRiskLevel) || 'high_safety',
    riskLevelLabel: modality.safety_level === 'moderate_risk' ? 'Moderate Caution / Monitored Protocol' :
                    modality.safety_level === 'high_risk' ? 'Clinical Oversight Required' : 'High Safety Profile',
    riskBadgeClass: modality.safety_level === 'moderate_risk' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    modality.safety_level === 'high_risk' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    safetySummary: modality.safety_summary || 'Evidence-backed protocol intervention. Safe for general adult population when implemented within stated dosing and duration guidelines.',
    importantConsiderations: [
      'Adhere strictly to verified dosing, exposure duration, and timing slots.',
      'Allow adequate recovery between consecutive sessions to prevent autonomic exhaustion.',
      'Discontinue immediately if experiencing pain, dizziness, or adverse reactions.'
    ],
    documentedContraindications: rawContra.length > 0 ? rawContra : [
      'Pregnancy or nursing (unless cleared by OB/GYN)',
      'Severe unmanaged chronic medical conditions'
    ],
    commonSideEffects: [
      {
        effect: 'Mild adaptation fatigue during initial week',
        mitigation: 'Ensure 7–9 hours of sleep and adequate hydration; reduce intensity by 30% if needed.'
      }
    ]
  }
}
