import { Modality, UserProfile, DailyProtocolTask, MedicalProfileData, ContraindicationWarning } from '@/lib/types'

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
  statin: ['atorvastatin', 'lipitor', 'rosuvastatin', 'crestor', 'simvastatin', 'zocor', 'pravastatin', 'cholesterol med'],
  hypertension: ['high blood pressure', 'elevated bp', 'hypertensive', 'uncontrolled hypertension', 'essential hypertension'],
  antihypertensive: ['lisinopril', 'losartan', 'amlodipine', 'metoprolol', 'atenolol', 'hydrochlorothiazide', 'hctz', 'blood pressure med', 'beta blocker', 'ace inhibitor', 'arb'],
  ssri: ['sertraline', 'zoloft', 'escitalopram', 'lexapro', 'fluoxetine', 'prozac', 'citalopram', 'celexa', 'paroxetine', 'paxil', 'antidepressant', 'snri', 'duloxetine', 'cymbalta', 'venlafaxine'],
  maoi: ['selegiline', 'emsam', 'phenelzine', 'nardil', 'tranylcypromine', 'parnate', 'rasagiline', 'azilect', 'mao inhibitor'],
  thyroid: ['levothyroxine', 'synthroid', 'armour thyroid', 'liothyronine', 'cytomel', 'hypothyroid', 'hashimoto'],
  hypoglycemic: ['metformin', 'glucophage', 'glipizide', 'semaglutide', 'ozempic', 'wegovy', 'tirzepatide', 'mounjaro', 'zepbound', 'insulin', 'glp 1', 'diabetes med'],
  arrhythmia: ['atrial fibrillation', 'afib', 'tachycardia', 'bradycardia', 'long qt', 'heart flutter', 'irregular heartbeat'],
  kidney_disease: ['chronic kidney disease', 'ckd', 'renal impairment', 'renal failure', 'low egfr', 'nephropathy'],
  liver_disease: ['cirrhosis', 'fatty liver', 'elevated ast', 'elevated alt', 'hepatitis', 'liver failure', 'hepatic impairment'],
  g6pd: ['g6pd deficiency', 'glucose 6 phosphate dehydrogenase', 'favism'],
  bleeding_disorder: ['hemophilia', 'von willebrand', 'thrombocytopenia', 'bleeding disorder', 'platelet disorder'],
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
          modalityName: modName,
          headline: `Prescription Interaction with ${med}`,
          clinicalRationale: `This modality has an established clinical contraindication with ${contraString}. Concurrent administration may lead to adverse pharmacological interactions or compromised efficacy.`,
          actionAdvice: `Consult your prescribing physician prior to taking ${modName} with ${med}.`
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
          modalityName: modName,
          headline: `Medical Precaution for ${cond}`,
          clinicalRationale: `This modality lists "${contraString}" as an explicit physiological contraindication.`,
          actionAdvice: `Do not initiate ${modName} without prior clinical clearance from your specialist.`
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
        modalityName: modName,
        headline: 'Critical Anticoagulant Antagonism',
        clinicalRationale: 'Vitamin K directly drives hepatic gamma-glutamyl carboxylase to synthesize clotting factors II, VII, IX, and X, directly negating vitamin K antagonists like Warfarin and dramatically increasing thrombotic risk.',
        actionAdvice: 'Strictly avoid supplemental Vitamin K unless specifically instructed and monitored via regular INR testing by your physician.'
      })
    }
    if (modId.includes('ginkgo') || modName.toLowerCase().includes('ginkgo')) {
      warnings.push({
        id: `rule_anticoag_ginkgo_${modId}`,
        level: 'caution',
        triggerTerm: 'Additive Antiplatelet Action',
        userItem: 'Blood Thinners',
        modalityName: modName,
        headline: 'Synergistic Bleeding Risk',
        clinicalRationale: 'Ginkgolide B is a potent platelet-activating factor (PAF) antagonist that magnifies bleeding risk and spontaneous hemorrhage when combined with systemic anticoagulants.',
        actionAdvice: 'Exercise caution and monitor for easy bruising or prolonged bleeding times.'
      })
    }
    if (modId.includes('nattokinase') || modName.toLowerCase().includes('nattokinase')) {
      warnings.push({
        id: `rule_anticoag_nattokinase_${modId}`,
        level: 'critical',
        triggerTerm: 'Direct Fibrinolytic Synergy',
        userItem: 'Blood Thinners',
        modalityName: modName,
        headline: 'Compounded Fibrinolytic Bleeding Hazard',
        clinicalRationale: 'Nattokinase possesses direct fibrinolytic and profibrinolytic properties, synergistically destabilizing hemostasis when combined with pharmaceutical anticoagulants.',
        actionAdvice: 'Avoid combining Nattokinase with blood thinners.'
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
        modalityName: modName,
        headline: 'Life-Threatening Serotonin Toxicity Hazard',
        clinicalRationale: 'Methylene Blue is a potent monoamine oxidase A (MAO-A) inhibitor. Combining it with SSRIs/SNRIs completely blocks central serotonin degradation, which can rapidly induce life-threatening Serotonin Syndrome.',
        actionAdvice: 'Methylene Blue is strictly contraindicated for anyone taking serotonergic medications (FDA Black Box Alert).'
      })
    }
    if (modId.includes('5_htp') || modId.includes('5-htp') || modName.toLowerCase().includes('5-htp') || modName.toLowerCase().includes('tryptophan')) {
      warnings.push({
        id: `rule_ssri_5htp_${modId}`,
        level: 'caution',
        triggerTerm: 'Serotonin Synthesis Surge',
        userItem: 'SSRI / SNRI',
        modalityName: modName,
        headline: 'Elevated Serotonin Toxicity Risk',
        clinicalRationale: 'Directly providing 5-HTP alongside reuptake inhibition causes uncontrolled synaptic serotonin accumulation.',
        actionAdvice: 'Avoid combining 5-HTP with prescription antidepressants.'
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
        modalityName: modName,
        headline: 'Acute Cardiovascular Stress Precaution',
        clinicalRationale: 'Sudden cold immersion triggers an intense peripheral vasoconstriction that spikes mean arterial pressure and simultaneously elicits divergent adrenergic/parasympathetic inputs (autonomic conflict), increasing arrhythmia risk.',
        actionAdvice: 'Never dive or submerge abruptly. Begin with gentle cool showers and avoid sub-50°F immersion without cardiologist approval.'
      })
    }
    if (modId.includes('yohimbine') || modName.toLowerCase().includes('yohimbine')) {
      warnings.push({
        id: `rule_cardio_yohimbine_${modId}`,
        level: 'critical',
        triggerTerm: 'Alpha-2 Adrenergic Spike',
        userItem: 'Hypertension / Cardiovascular Condition',
        modalityName: modName,
        headline: 'Hypertensive Pressor Hazard',
        clinicalRationale: 'Yohimbine blocks presynaptic alpha-2 adrenoceptors, triggering uninhibited systemic norepinephrine release and dangerous spikes in heart rate and systolic blood pressure.',
        actionAdvice: 'Strictly avoid Yohimbine with a history of cardiovascular disease or hypertension.'
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
        modalityName: modName,
        headline: 'Acute Hemolytic Anemia Hazard',
        clinicalRationale: 'G6PD-deficient erythrocytes cannot generate adequate NADPH to reduce methylene blue metabolites, leading to rapid, catastrophic oxidative hemolysis of red blood cells.',
        actionAdvice: 'Methylene Blue is strictly contraindicated for G6PD deficiency.'
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
        modalityName: modName,
        headline: 'Additive Hypoglycemia Precaution',
        clinicalRationale: 'Berberine powerfully stimulates AMPK and enhances peripheral insulin sensitivity. Combining it with pharmaceutical glucose-lowering agents can cause sudden hypoglycemia.',
        actionAdvice: 'Routinely check capillary blood glucose and coordinate dosage with your clinician.'
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
        modalityName: modName,
        headline: 'Oncological Growth Signal Hazard',
        clinicalRationale: 'Growth hormone secretagogues increase systemic IGF-1 and somatotropic axis activity, which can drive accelerated mitotic proliferation and inhibit apoptosis in neoplastic tissues.',
        actionAdvice: 'GHRP and GHRH peptides are strictly contraindicated with active malignancy.'
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
