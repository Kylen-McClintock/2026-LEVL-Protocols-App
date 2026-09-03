import { Modality, UserProfile, DailyProtocolTask, MedicalProfileData, ContraindicationWarning, SafeModalityAlternative } from '@/lib/types'

/**
 * Standardizes user health and medication entries from either structured JSON or comma/newline delimited text.
 */
export function parseMedicalProfile(profile?: UserProfile | null): MedicalProfileData {
  if (!profile) {
    return { medications: [], conditions: [], allergies: [], notes: '' }
  }

  const parseList = (raw?: string): string[] => {
    if (!raw || typeof raw !== 'string') return []
    const trimmed = raw.trim()
    if (!trimmed) return []

    // Attempt JSON parse
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean)
        if (typeof parsed === 'object') {
          const items = parsed.items || parsed.medications || parsed.conditions || parsed.tags || []
          if (Array.isArray(items)) return items.map(item => String(item).trim()).filter(Boolean)
        }
      } catch (e) {}
    }

    // Split by comma or newline
    return trimmed
      .split(/[\n,;]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
  }

  const medications = parseList(profile.medications_and_treatments_text)
  const conditions = parseList(profile.health_conditions_text)

  return {
    medications,
    conditions,
    allergies: [],
    notes: ''
  }
}

/**
 * Normalizes strings for robust fuzzy matching (e.g. "blood-thinners" -> "blood thinner")
 */
function normalizeTerm(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Synonym and category mapping for common medical classifications
 */
const CLASS_SYNONYMS: Record<string, string[]> = {
  anticoagulant: ['warfarin', 'coumadin', 'eliquis', 'xarelto', 'pradaxa', 'plavix', 'clopidogrel', 'aspirin', 'blood thinner', 'blood thinners', 'heparin', 'antiplatelet'],
  statin: ['atorvastatin', 'lipitor', 'rosuvastatin', 'crestor', 'simvastatin', 'zocor', 'pravastatin', 'cholesterol med', 'pcsk9'],
  hypertension: ['high blood pressure', 'elevated bp', 'hypertensive', 'uncontrolled hypertension', 'essential hypertension'],
  antihypertensive: ['lisinopril', 'losartan', 'amlodipine', 'metoprolol', 'atenolol', 'hydrochlorothiazide', 'hctz', 'blood pressure med', 'beta blocker', 'ace inhibitor', 'arb', 'calcium channel blocker'],
  ssri: ['sertraline', 'zoloft', 'escitalopram', 'lexapro', 'fluoxetine', 'prozac', 'citalopram', 'celexa', 'paroxetine', 'paxil', 'antidepressant', 'snri', 'duloxetine', 'cymbalta', 'venlafaxine', 'wellbutrin', 'bupropion'],
  maoi: ['selegiline', 'emsam', 'phenelzine', 'nardil', 'tranylcypromine', 'parnate', 'rasagiline', 'azilect', 'mao inhibitor', 'maoi'],
  stimulant: ['stimulant', 'adderall', 'vyvanse', 'ritalin', 'methylphenidate', 'modafinil', 'armodafinil', 'amphetamine', 'dexedrine', 'adhd med'],
  glp1: ['semaglutide', 'ozempic', 'wegovy', 'tirzepatide', 'mounjaro', 'zepbound', 'liraglutide', 'saxenda', 'glp 1', 'glp1', 'incretin'],
  metformin: ['metformin', 'glucophage', 'ampk activator', 'sglt2', 'empagliflozin', 'jardiance', 'dapagliflozin', 'farxiga'],
  thyroid: ['levothyroxine', 'synthroid', 'armour thyroid', 'liothyronine', 'cytomel', 'hypothyroid', 'hashimoto', 'thyroid hormone'],
  hrt_trt: ['testosterone', 'trt', 'estrogen', 'estradiol', 'progesterone', 'hrt', 'hormone replacement', 'dhea', 'sex hormones'],
  immunosuppressant: ['rapamycin', 'sirolimus', 'everolimus', 'cyclosporine', 'tacrolimus', 'methotrexate', 'biologic', 'prednisone', 'corticosteroid', 'dexamethasone', 'humira'],
  sedative_sleep: ['ambien', 'zolpidem', 'xanax', 'alprazolam', 'ativan', 'lorazepam', 'klonopin', 'clonazepam', 'gabapentin', 'pregabalin', 'lyrica', 'benzodiazepine', 'z drug', 'sleep med', 'sedative'],
  pde5: ['tadalafil', 'cialis', 'sildenafil', 'viagra', 'pde5 inhibitor', 'pde 5'],
  ppi_antacid: ['omeprazole', 'prilosec', 'pantoprazole', 'esomeprazole', 'nexium', 'famotidine', 'pepcid', 'ppi', 'proton pump inhibitor', 'h2 blocker', 'acid blocker'],
  antihistamine: ['cetirizine', 'zyrtec', 'loratadine', 'claritin', 'fexofenadine', 'allegra', 'diphenhydramine', 'benadryl', 'ketotifen', 'antihistamine', 'mast cell'],
  hypoglycemic: ['metformin', 'glucophage', 'glipizide', 'semaglutide', 'ozempic', 'wegovy', 'tirzepatide', 'mounjaro', 'zepbound', 'insulin', 'glp 1', 'diabetes med', 'sglt2'],
  arrhythmia: ['atrial fibrillation', 'afib', 'tachycardia', 'bradycardia', 'long qt', 'heart flutter', 'irregular heartbeat'],
  pots: ['pots', 'postural orthostatic tachycardia', 'orthostatic hypotension', 'low blood pressure', 'dysautonomia'],
  kidney_disease: ['chronic kidney disease', 'ckd', 'renal impairment', 'renal failure', 'low egfr', 'nephropathy', 'kidney disease'],
  liver_disease: ['cirrhosis', 'fatty liver', 'elevated ast', 'elevated alt', 'hepatitis', 'liver failure', 'hepatic impairment', 'nafld', 'masld', 'nash'],
  g6pd: ['g6pd deficiency', 'glucose 6 phosphate dehydrogenase', 'favism'],
  bleeding_disorder: ['hemophilia', 'von willebrand', 'thrombocytopenia', 'bleeding disorder', 'platelet disorder', 'easy bruising'],
  epilepsy: ['epilepsy', 'seizure', 'convulsion', 'history of seizures', 'anticonvulsant'],
  osteoporosis: ['osteopenia', 'osteoporosis', 'low bone density', 'bone loss'],
  autoimmune: ['autoimmune', 'hashimoto', 'rheumatoid arthritis', 'crohn', 'colitis', 'lupus', 'psoriasis', 'ankylosing spondylitis', 'celiac', 'sjogren'],
  histamine: ['histamine intolerance', 'mcas', 'mast cell activation', 'high histamine'],
  malignancy: ['cancer', 'tumor', 'active cancer', 'oncology', 'chemotherapy', 'lymphoma', 'leukemia', 'carcinoma', 'melanoma', 'neoplasm']
}

/**
 * Checks whether user entry matches a target clinical class or term
 */
function isTermMatch(userEntry: string, targetKeyOrSynonyms: string | string[]): boolean {
  const normUser = normalizeTerm(userEntry)
  const targets = Array.isArray(targetKeyOrSynonyms) ? targetKeyOrSynonyms : [targetKeyOrSynonyms]

  for (const t of targets) {
    const normTarget = normalizeTerm(t)
    if (normUser.includes(normTarget) || normTarget.includes(normUser)) return true

    // Check class synonyms
    for (const [cls, syns] of Object.entries(CLASS_SYNONYMS)) {
      const clsMatchesTarget = normTarget.includes(cls) || syns.some(s => normTarget.includes(s))
      const userMatchesCls = normUser.includes(cls) || syns.some(s => normUser.includes(s))
      if (clsMatchesTarget && userMatchesCls) return true
    }
  }
  return false
}

/**
 * Resolves an evidence-based safe alternative modality tailored to the user's condition.
 */
function resolveGenericSafeAlternative(modality: Modality, userItem: string): SafeModalityAlternative {
  const cat = (modality.category || '').toLowerCase()
  const modType = (modality.modality_type || '').toLowerCase()
  const name = (modality.name || '').toLowerCase()

  if (cat.includes('fitness') || cat.includes('physical') || modType.includes('exercise')) {
    return {
      id: 'zone_2_cardio',
      name: 'Zone 2 Steady-State Incline Walking',
      category: 'fitness',
      outcome: 'Cardiovascular Longevity & Mitochondrial Biogenesis',
      rationale: 'Maintains low cardiac shear strain and stable hemodynamic pressures while preserving zone 2 aerobic adaptations.'
    }
  }

  if (name.includes('cold') || name.includes('plunge') || name.includes('ice') || name.includes('cryo')) {
    return {
      id: 'contrast_shower',
      name: 'Mild Contrast Hydrotherapy (Warm to Cool)',
      category: 'recovery',
      outcome: 'Vascular Tone & Autonomic Balance',
      rationale: 'Gentle temperature cycling enhances peripheral circulation without the pressor reflex or arrhythmia risks of extreme freezing immersion.'
    }
  }

  if (name.includes('breath') || name.includes('sigh') || name.includes('hyperventilation')) {
    return {
      id: 'cyclic_sighing',
      name: 'Physiological Cyclic Sighing (Double Inhale, Long Exhale)',
      category: 'breathwork',
      outcome: 'Autonomic Down-Regulation & Stress Relief',
      rationale: 'Directly stimulates vagal efferents to lower heart rate and calm the sympathetic nervous system without hypocapnic risk.'
    }
  }

  if (cat.includes('nutrition') || modType.includes('supplement')) {
    if (name.includes('curcumin') || name.includes('turmeric') || name.includes('anti-inflamm')) {
      return {
        id: 'pea_palmitoylethanolamide',
        name: 'Palmitoylethanolamide (PEA 400mg)',
        category: 'nutrition',
        outcome: 'Systemic & Joint Tissue Comfort',
        rationale: 'Endogenous lipid mediator that reduces neuroinflammation and tissue sensitivity without anticoagulant effects.'
      }
    }
    if (name.includes('sleep') || name.includes('bed') || name.includes('relax') || name.includes('night')) {
      return {
        id: 'magnesium_glycinate',
        name: 'Magnesium L-Threonate or Glycinate (200mg)',
        category: 'nutrition',
        outcome: 'Restorative Sleep Architecture & Brain Relaxation',
        rationale: 'Elevates CSF magnesium to support GABA-A allosteric relaxation safely without sedating drug-drug interactions.'
      }
    }
    return {
      id: 'l_theanine',
      name: 'L-Theanine (100–200mg)',
      category: 'nutrition',
      outcome: 'Neurotransmitter Balance & Calm Clarity',
      rationale: 'Increases occipital alpha brain waves and calm executive focus without interacting with hepatic CYP pathways.'
    }
  }

  return {
    id: 'coherent_breathing',
    name: 'Coherent Resonant Breathing (5.5 Breaths/Min)',
    category: 'breathwork',
    outcome: 'Systemic Homeostasis & Vagal Tone',
    rationale: 'Universal, risk-free modality clinically demonstrated to optimize autonomic balance, HRV, and emotional resilience.'
  }
}

/**
 * Evaluates whether a given modality has clinical contraindications for the user's health profile.
 */
export function detectContraindications(
  modality: Modality | null | undefined, 
  profile?: UserProfile | null
): ContraindicationWarning[] {
  if (!modality || !profile) return []

  const { medications, conditions } = parseMedicalProfile(profile)
  if (medications.length === 0 && conditions.length === 0) return []

  const warnings: ContraindicationWarning[] = []
  const modName = modality.name || modality.slug || ''
  const modId = (modality.id || modality.slug || '').toLowerCase()
  const rawContraindications = Array.isArray(modality.contraindications) ? modality.contraindications : []

  // -------------------------------------------------------------
  // 1. MATCH AGAINST MODALITY'S OFFICIAL CONTRAINDICATION STRINGS
  // -------------------------------------------------------------
  rawContraindications.forEach((contraString, idx) => {
    const normContra = normalizeTerm(contraString)

    // Check Medications
    medications.forEach(med => {
      if (isTermMatch(med, contraString)) {
        warnings.push({
          id: `contra_med_${idx}_${modId}`,
          level: 'critical',
          triggerTerm: contraString,
          userItem: med,
          category: 'medication',
          modalityId: modality.id || modality.slug || modId,
          modalityName: modName,
          headline: `Prescription Interaction with ${med}`,
          clinicalRationale: `This modality has an established clinical contraindication with ${contraString}. Concurrent administration may lead to adverse pharmacological interactions or compromised efficacy.`,
          actionAdvice: `Consult your prescribing physician prior to taking ${modName} with ${med}.`,
          safeAlternative: resolveGenericSafeAlternative(modality, med)
        })
      }
    })

    // Check Conditions
    conditions.forEach(cond => {
      if (isTermMatch(cond, contraString)) {
        warnings.push({
          id: `contra_cond_${idx}_${modId}`,
          level: 'critical',
          triggerTerm: contraString,
          userItem: cond,
          category: 'condition',
          modalityId: modality.id || modality.slug || modId,
          modalityName: modName,
          headline: `Medical Precaution for ${cond}`,
          clinicalRationale: `This modality lists "${contraString}" as an explicit physiological contraindication.`,
          actionAdvice: `Do not initiate ${modName} without prior clinical clearance from your specialist.`,
          safeAlternative: resolveGenericSafeAlternative(modality, cond)
        })
      }
    })
  })

  // -------------------------------------------------------------
  // 2. CURATED LONGEVITY PHARMACOKINETIC & BIOCHEMICAL RULES
  // -------------------------------------------------------------

  // Rule A: Blood Thinners x Vitamin K2 / Ginkgo / High-Dose EPA
  const hasBloodThinner = medications.some(m => isTermMatch(m, CLASS_SYNONYMS.anticoagulant))
  if (hasBloodThinner) {
    if (modId.includes('vitamin_k') || modId.includes('k2') || modName.toLowerCase().includes('vitamin k')) {
      warnings.push({
        id: `rule_anticoag_k2_${modId}`,
        level: 'critical',
        triggerTerm: 'Anticoagulant Antagonism',
        userItem: 'Blood Thinners / Anticoagulants',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Critical Anticoagulant Antagonism',
        clinicalRationale: 'Vitamin K directly drives hepatic gamma-glutamyl carboxylase to synthesize clotting factors II, VII, IX, and X, directly negating vitamin K antagonists like Warfarin and dramatically increasing thrombotic risk.',
        actionAdvice: 'Strictly avoid supplemental Vitamin K unless specifically instructed and monitored via regular INR testing by your physician.',
        safeAlternative: {
          id: 'magnesium_glycinate',
          name: 'Magnesium Glycinate (200–400mg)',
          category: 'nutrition',
          outcome: 'Cardiovascular & Endothelial Vascular Support',
          rationale: 'Supports arterial relaxation and vascular tone without interfering with hepatic clotting factors or vitamin K epoxide reductase.'
        }
      })
    }
    if (modId.includes('ginkgo') || modName.toLowerCase().includes('ginkgo')) {
      warnings.push({
        id: `rule_anticoag_ginkgo_${modId}`,
        level: 'caution',
        triggerTerm: 'Additive Antiplatelet Action',
        userItem: 'Blood Thinners',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Synergistic Bleeding Risk',
        clinicalRationale: 'Ginkgolide B is a potent platelet-activating factor (PAF) antagonist that magnifies bleeding risk and spontaneous hemorrhage when combined with systemic anticoagulants.',
        actionAdvice: 'Exercise caution and monitor for easy bruising or prolonged bleeding times.',
        safeAlternative: {
          id: 'citicoline',
          name: 'Citicoline (CDP-Choline 250mg)',
          category: 'nutrition',
          outcome: 'Cerebral Perfusion & Cognitive Acuity',
          rationale: 'Nourishes neuronal membrane phospholipids and enhances brain acetylcholine without platelet-activating factor antagonism.'
        }
      })
    }
    if (modId.includes('nattokinase') || modName.toLowerCase().includes('nattokinase')) {
      warnings.push({
        id: `rule_anticoag_nattokinase_${modId}`,
        level: 'critical',
        triggerTerm: 'Direct Fibrinolytic Synergy',
        userItem: 'Blood Thinners',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Compounded Fibrinolytic Bleeding Hazard',
        clinicalRationale: 'Nattokinase possesses direct fibrinolytic and profibrinolytic properties, synergistically destabilizing hemostasis when combined with pharmaceutical anticoagulants.',
        actionAdvice: 'Avoid combining Nattokinase with blood thinners.',
        safeAlternative: {
          id: 'pea_palmitoylethanolamide',
          name: 'Palmitoylethanolamide (PEA 400mg)',
          category: 'nutrition',
          outcome: 'Microvascular Comfort & Anti-Inflammation',
          rationale: 'Safe lipid mediator for tissue and vascular inflammation that has zero anticoagulant or fibrinolytic activity.'
        }
      })
    }
  }

  // Rule B: SSRIs / SNRIs x Methylene Blue (Serotonin Syndrome)
  const hasSSRI = medications.some(m => isTermMatch(m, CLASS_SYNONYMS.ssri))
  if (hasSSRI) {
    if (modId.includes('methylene_blue') || modName.toLowerCase().includes('methylene blue')) {
      warnings.push({
        id: `rule_ssri_mb_${modId}`,
        level: 'critical',
        triggerTerm: 'Severe Serotonin Syndrome Warning',
        userItem: 'Serotonergic Medication (SSRI / SNRI)',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Life-Threatening Serotonin Toxicity Hazard',
        clinicalRationale: 'Methylene Blue is a potent monoamine oxidase A (MAO-A) inhibitor. Combining it with SSRIs/SNRIs completely blocks central serotonin degradation, which can rapidly induce life-threatening Serotonin Syndrome.',
        actionAdvice: 'Methylene Blue is strictly contraindicated for anyone taking serotonergic medications (FDA Black Box Alert).',
        safeAlternative: {
          id: 'red_light_therapy',
          name: 'Red & Near-Infrared Light (660nm/850nm)',
          category: 'light',
          outcome: 'Mitochondrial Complex IV ATP Production',
          rationale: 'Direct photon stimulation of Cytochrome c Oxidase bypasses monoamine oxidase entirely, delivering clean cellular energy with zero Serotonin Syndrome risk.'
        }
      })
    }
    if (modId.includes('5_htp') || modId.includes('5-htp') || modName.toLowerCase().includes('5-htp') || modName.toLowerCase().includes('tryptophan')) {
      warnings.push({
        id: `rule_ssri_5htp_${modId}`,
        level: 'caution',
        triggerTerm: 'Serotonin Synthesis Surge',
        userItem: 'SSRI / SNRI',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Elevated Serotonin Toxicity Risk',
        clinicalRationale: 'Directly providing 5-HTP alongside reuptake inhibition causes uncontrolled synaptic serotonin accumulation.',
        actionAdvice: 'Avoid combining 5-HTP with prescription antidepressants.',
        safeAlternative: {
          id: 'l_theanine',
          name: 'L-Theanine (200mg)',
          category: 'nutrition',
          outcome: 'Calm Focus & Alpha-Wave Relaxation',
          rationale: 'Increases inhibitory GABA neurotransmission and alpha wave amplitude without synthesizing serotonin.'
        }
      })
    }
  }

  // Rule C: Hypertension / Cardiac Arrhythmia x Extreme Cold Plunge / Cold Shock
  const hasCardioPrecaution = conditions.some(c => isTermMatch(c, CLASS_SYNONYMS.hypertension) || isTermMatch(c, CLASS_SYNONYMS.arrhythmia))
  if (hasCardioPrecaution) {
    if (modId.includes('cold_plunge') || modId.includes('ice_bath') || modName.toLowerCase().includes('cold plunge') || modName.toLowerCase().includes('ice bath')) {
      warnings.push({
        id: `rule_cardio_coldplunge_${modId}`,
        level: 'caution',
        triggerTerm: 'Acute Cold Shock Pressor Reflex',
        userItem: 'Cardiovascular Condition / Hypertension',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Acute Cardiovascular Stress Precaution',
        clinicalRationale: 'Sudden cold immersion triggers an intense peripheral vasoconstriction that spikes mean arterial pressure and simultaneously elicits divergent adrenergic/parasympathetic inputs (autonomic conflict), increasing arrhythmia risk.',
        actionAdvice: 'Never dive or submerge abruptly. Begin with gentle cool showers and avoid sub-50°F immersion without cardiologist approval.',
        safeAlternative: {
          id: 'contrast_shower',
          name: 'Mild Contrast Hydrotherapy (Warm to Cool)',
          category: 'recovery',
          outcome: 'Vascular Flushing & Vagal Rebound',
          rationale: 'Gradual thermal shifts stimulate peripheral circulation without the sharp hypertensive cold-shock pressor surge.'
        }
      })
    }
    if (modId.includes('yohimbine') || modName.toLowerCase().includes('yohimbine')) {
      warnings.push({
        id: `rule_cardio_yohimbine_${modId}`,
        level: 'critical',
        triggerTerm: 'Alpha-2 Adrenergic Spike',
        userItem: 'Hypertension / Cardiovascular Condition',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Hypertensive Pressor Hazard',
        clinicalRationale: 'Yohimbine blocks presynaptic alpha-2 adrenoceptors, triggering uninhibited systemic norepinephrine release and dangerous spikes in heart rate and systolic blood pressure.',
        actionAdvice: 'Strictly avoid Yohimbine with a history of cardiovascular disease or hypertension.',
        safeAlternative: {
          id: 'coherent_breathing',
          name: 'Coherent Breathing (5.5s Inhale / 5.5s Exhale)',
          category: 'breathwork',
          outcome: 'Autonomic Balance & Executive Focus',
          rationale: 'Maximizes heart rate variability (HRV) and cerebral oxygenation while lowering systolic blood pressure.'
        }
      })
    }
  }

  // Rule D: G6PD Deficiency x Methylene Blue & High Dose IV Ascorbate
  const hasG6PD = conditions.some(c => isTermMatch(c, CLASS_SYNONYMS.g6pd))
  if (hasG6PD) {
    if (modId.includes('methylene_blue') || modName.toLowerCase().includes('methylene blue')) {
      warnings.push({
        id: `rule_g6pd_mb_${modId}`,
        level: 'critical',
        triggerTerm: 'G6PD Hemolytic Crisis',
        userItem: 'G6PD Deficiency',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Acute Hemolytic Anemia Hazard',
        clinicalRationale: 'G6PD-deficient erythrocytes cannot generate adequate NADPH to reduce methylene blue metabolites, leading to rapid, catastrophic oxidative hemolysis of red blood cells.',
        actionAdvice: 'Methylene Blue is strictly contraindicated for G6PD deficiency.',
        safeAlternative: {
          id: 'red_light_therapy',
          name: 'Photobiomodulation / Near-IR Light',
          category: 'light',
          outcome: 'Mitochondrial Respiration & Energy',
          rationale: 'Safe non-oxidative mitochondrial photoreception that does not deplete erythrocyte NADPH.'
        }
      })
    }
  }

  // Rule E: Diabetes / Hypoglycemic Prescriptions x Berberine
  const hasHypoglycemic = medications.some(m => isTermMatch(m, CLASS_SYNONYMS.hypoglycemic))
  if (hasHypoglycemic) {
    if (modId.includes('berberine') || modName.toLowerCase().includes('berberine')) {
      warnings.push({
        id: `rule_hypoglycemic_berberine_${modId}`,
        level: 'caution',
        triggerTerm: 'Compound Glucose Reduction',
        userItem: 'Hypoglycemic Prescription (Metformin / Insulin / GLP-1)',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Additive Hypoglycemia Precaution',
        clinicalRationale: 'Berberine powerfully stimulates AMPK and enhances peripheral insulin sensitivity. Combining it with pharmaceutical glucose-lowering agents can cause sudden hypoglycemia.',
        actionAdvice: 'Routinely check capillary blood glucose and coordinate dosage with your clinician.',
        safeAlternative: {
          id: 'post_meal_glucose_walk',
          name: 'Post-Meal Glucose Disposal Walk (10–15 min)',
          category: 'fitness',
          outcome: 'Postprandial Glycemic Control',
          rationale: 'Non-pharmacological GLUT-4 glucose clearance that avoids compounding medication-induced hypoglycemia.'
        }
      })
    }
  }

  // Rule F: Active Malignancy x Growth Hormone Secretagogues
  const hasCancer = conditions.some(c => isTermMatch(c, CLASS_SYNONYMS.malignancy))
  if (hasCancer) {
    if (modId.includes('ipamorelin') || modId.includes('cjc') || modId.includes('mk677') || modId.includes('ghrp')) {
      warnings.push({
        id: `rule_cancer_ghrp_${modId}`,
        level: 'critical',
        triggerTerm: 'Mitogenic & IGF-1 Acceleration',
        userItem: 'Active Cancer / Neoplasia History',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Oncological Growth Signal Hazard',
        clinicalRationale: 'Growth hormone secretagogues increase systemic IGF-1 and somatotropic axis activity, which can drive accelerated mitotic proliferation and inhibit apoptosis in neoplastic tissues.',
        actionAdvice: 'GHRP and GHRH peptides are strictly contraindicated with active malignancy.',
        safeAlternative: {
          id: 'deep_sleep_hygiene',
          name: 'Circadian Sleep Optimization & Evening Wind-Down',
          category: 'sleep',
          outcome: 'Endogenous Cellular Repair',
          rationale: 'Supports physiological tissue repair through natural slow-wave sleep cycles without exogenous somatotropic IGF-1 promotion.'
        }
      })
    }
  }

  // Rule G: Stimulant Prescriptions x High Adrenergic Agents (Yohimbine, Ephedrine)
  const hasStimulant = medications.some(m => isTermMatch(m, CLASS_SYNONYMS.stimulant))
  if (hasStimulant) {
    if (modId.includes('yohimbine') || modName.toLowerCase().includes('yohimbine') || modId.includes('ephedrine')) {
      warnings.push({
        id: `rule_stimulant_yohimbine_${modId}`,
        level: 'critical',
        triggerTerm: 'Additive Adrenergic Surge',
        userItem: 'Stimulant Prescription (Adderall / Vyvanse / Modafinil)',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Dangerous Sympathomimetic Hazard',
        clinicalRationale: 'Combining central dopamine/norepinephrine stimulants with alpha-2 adrenergic antagonists (Yohimbine) produces compounded tachycardia, malignant hypertension, and cardiac strain.',
        actionAdvice: 'Strictly avoid Yohimbine and sympathomimetic thermogenics while taking prescription stimulants.',
        safeAlternative: {
          id: 'coherent_breathing',
          name: 'Coherent Breathing (5.5 Breaths/Min)',
          category: 'breathwork',
          outcome: 'Prefrontal Cortex Focus & Calm Stamina',
          rationale: 'Enhances executive cognitive control via parasympathetic-sympathetic balance without compounding tachycardia.'
        }
      })
    }
  }

  // Rule H: Epilepsy / Seizure History x Cyclic Hyperventilation (Wim Hof / Breath Holds)
  const hasEpilepsy = conditions.some(c => isTermMatch(c, CLASS_SYNONYMS.epilepsy))
  if (hasEpilepsy) {
    if (modId.includes('hyperventilation') || modId.includes('wim_hof') || modName.toLowerCase().includes('wim hof') || modName.toLowerCase().includes('hyperventilation')) {
      warnings.push({
        id: `rule_epilepsy_breathwork_${modId}`,
        level: 'critical',
        triggerTerm: 'Hypocapnic Seizure Threshold Lowering',
        userItem: 'History of Seizures / Epilepsy',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Seizure Induction Precaution',
        clinicalRationale: 'Prolonged cyclic hyperventilation causes acute cerebral vasoconstriction and hypocapnia (drop in arterial pCO2), which directly triggers generalized spike-and-wave discharges and lowers the clinical seizure threshold.',
        actionAdvice: 'Avoid vigorous hyperventilation breathwork. Stick to gentle parasympathetic patterns like Box Breathing or Cyclic Sighing.',
        safeAlternative: {
          id: 'cyclic_sighing',
          name: 'Physiological Cyclic Sighing (Double Inhale, Long Exhale)',
          category: 'breathwork',
          outcome: 'Autonomic Down-Regulation & Stress Relief',
          rationale: 'Soothes the nervous system without hyperventilatory hypocapnia or cerebral vasoconstriction.'
        }
      })
    }
  }

  // Rule I: POTS / Orthostatic Hypotension x Extreme Sauna / Hot Plunge
  const hasPOTS = conditions.some(c => isTermMatch(c, CLASS_SYNONYMS.pots))
  if (hasPOTS) {
    if (modId.includes('sauna') || modName.toLowerCase().includes('sauna') || modId.includes('hot_bath')) {
      warnings.push({
        id: `rule_pots_sauna_${modId}`,
        level: 'caution',
        triggerTerm: 'Peripheral Vasodilatory Syncope',
        userItem: 'POTS / Orthostatic Hypotension',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Orthostatic Blood Pressure Drop Risk',
        clinicalRationale: 'High ambient thermal exposure produces profound peripheral vasodilation, resulting in severe venous pooling and compensatory tachycardia that can trigger syncope (fainting) upon standing in POTS patients.',
        actionAdvice: 'Limit sauna temperature to moderate levels, hydrate heavily with sodium/electrolytes pre/post, and exit slowly while seated.',
        safeAlternative: {
          id: 'infrared_sauna_mild',
          name: 'Mild Infrared Session with Electrolytes (120°F–130°F)',
          category: 'recovery',
          outcome: 'Gentle Tissue Diaphoresis & Circulation',
          rationale: 'Gentle radiant heat paired with sodium/electrolyte hydration prevents orthostatic venous pooling and tachycardia.'
        }
      })
    }
  }

  // Rule J: PDE5 Inhibitors x High-Dose Nitric Oxide Donors
  const hasPDE5 = medications.some(m => isTermMatch(m, CLASS_SYNONYMS.pde5))
  if (hasPDE5) {
    if (modId.includes('nitroglycerin') || modName.toLowerCase().includes('nitroglycerin')) {
      warnings.push({
        id: `rule_pde5_nitrate_${modId}`,
        level: 'critical',
        triggerTerm: 'Synergistic cGMP Hypotension',
        userItem: 'PDE5 Inhibitor (Tadalafil / Sildenafil)',
        modalityId: modality.id || modality.slug || modId,
        modalityName: modName,
        headline: 'Severe Hypotensive Shock Hazard',
        clinicalRationale: 'PDE5 inhibitors prevent cyclic GMP degradation, leading to massive, uncontrolled vasodilation and fatal hypotension when combined with organic nitrates.',
        actionAdvice: 'Never combine PDE5 inhibitors with nitrates.',
        safeAlternative: {
          id: 'l_citrulline_low',
          name: 'Dietary Beetroot / Arginine Whole Foods',
          category: 'nutrition',
          outcome: 'Physiological Endothelial Tone',
          rationale: 'Provides mild dietary substrate for basal endothelial nitric oxide synthase without dangerous precipitous blood pressure drops.'
        }
      })
    }
  }

  // Deduplicate warnings by ID
  const seenIds = new Set<string>()
  return warnings.filter(w => {
    if (seenIds.has(w.id)) return false
    seenIds.add(w.id)
    return true
  })
}

/**
 * Scans a user's active protocol tasks against their medical profile to identify all potential conflicts.
 */
export function auditScheduleSafety(
  tasks: DailyProtocolTask[], 
  profile?: UserProfile | null
): ContraindicationWarning[] {
  if (!tasks || tasks.length === 0 || !profile) return []

  const allWarnings: ContraindicationWarning[] = []
  const seenModalityIds = new Set<string>()

  tasks.forEach(task => {
    const modality = task.protocol_step?.modality || task.loose_modality || (task as any).modality
    if (!modality) return

    const mId = modality.id || modality.slug || ''
    if (seenModalityIds.has(mId)) return
    seenModalityIds.add(mId)

    const modalityWarnings = detectContraindications(modality, profile)
    allWarnings.push(...modalityWarnings)
  })

  return allWarnings
}
