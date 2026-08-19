import { Modality } from '@/lib/types'

export interface ModalityBiochemicalProfile {
  isFatSolubleLipophilic?: boolean
  isMethylDonorConsumer?: boolean
  isMethylDonor?: boolean
  isDivalentMineral?: boolean
  isHighDoseAntioxidant?: boolean
  isMtorStimulator?: boolean
  isAmpkActivator?: boolean
  isGabaergicSedative?: boolean
  isCentralStimulant?: boolean
  isColdHormesis?: boolean
  isHeatHormesis?: boolean
  isSenolyticPulse?: boolean
  isNitricOxideBooster?: boolean
  isMitochondrialOxidase?: boolean
  isProlongedFast?: boolean
  isPostprandialMetabolic?: boolean
  isCholinergicNootropic?: boolean
  primaryCompoundFamily?: string
}

function normStr(str?: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Classifies any modality into rich biological & pharmacokinetic ontology flags.
 */
export function classifyModalityOntology(modality: Modality): ModalityBiochemicalProfile {
  const id = normStr(modality.id)
  const name = normStr(modality.name || modality.display_name)
  const cat = normStr(modality.category)
  const desc = normStr(modality.brief_description)

  const profile: ModalityBiochemicalProfile = {}

  // 1. Fat-Soluble / Lipophilic (requires dietary lipids for absorption)
  if (
    id.includes('vitamind') || name.includes('vitamind') ||
    id.includes('vitamink') || name.includes('vitamink') ||
    id.includes('mk7') || id.includes('mk4') ||
    id.includes('vitamine') || name.includes('vitamine') ||
    id.includes('coq10') || name.includes('coq10') || id.includes('ubiquinol') ||
    id.includes('fisetin') || name.includes('fisetin') ||
    id.includes('quercetin') || name.includes('quercetin') ||
    id.includes('resveratrol') || name.includes('resveratrol') || id.includes('pterostilbene') ||
    id.includes('curcumin') || name.includes('curcumin') ||
    id.includes('astaxanthin') || name.includes('astaxanthin') ||
    id.includes('lycopene') || name.includes('lycopene') ||
    id.includes('apigenin') || name.includes('apigenin') ||
    id.includes('bacopa') || name.includes('bacopa') ||
    id.includes('ashwagandha') || name.includes('ashwagandha')
  ) {
    profile.isFatSolubleLipophilic = true
    profile.primaryCompoundFamily = 'Lipophilic Nutrient / Polyphenol'
  }

  // 2. Methyl Donor Consumers (Consumes SAMe via NNMT)
  if (
    id.includes('nmn') || name.includes('nmn') ||
    id.includes('nicotinamide') || name.includes('nicotinamide') ||
    id.includes('nr') || id.includes('nad') || name.includes('nad')
  ) {
    profile.isMethylDonorConsumer = true
    profile.primaryCompoundFamily = 'NAD+ Precursor'
  }

  // 3. Methyl Donors / Replenishers
  if (
    id.includes('tmg') || name.includes('tmg') || id.includes('betaine') || name.includes('betaine') ||
    id.includes('methylfolate') || name.includes('methylfolate') ||
    id.includes('methylcobalamin') || id.includes('choline') || id.includes('mthfr')
  ) {
    profile.isMethylDonor = true
    profile.primaryCompoundFamily = 'Methylation Donor'
  }

  // 4. Divalent Metal Minerals (Compete for DMT-1 Transporters)
  if (
    id.includes('iron') || name.includes('iron') || id.includes('heme') ||
    id.includes('zinc') || name.includes('zinc') ||
    id.includes('copper') || name.includes('copper') ||
    id.includes('calcium') || name.includes('calcium')
  ) {
    profile.isDivalentMineral = true
    profile.primaryCompoundFamily = 'Divalent Trace Mineral'
  }

  // 5. High-Dose Antioxidants (Scavenges beneficial post-exercise ROS)
  if (
    (id.includes('vitaminc') || name.includes('vitaminc')) ||
    (id.includes('vitamine') || name.includes('vitamine')) ||
    (id.includes('nac') || name.includes('nac') || id.includes('glutathione'))
  ) {
    profile.isHighDoseAntioxidant = true
    profile.primaryCompoundFamily = 'Exogenous Antioxidant'
  }

  // 6. mTOR Stimulators & Mechanical Hypertrophy
  if (
    id.includes('resistancetraining') || name.includes('resistancetraining') ||
    id.includes('strength') || name.includes('strength') ||
    id.includes('weightlifting') || id.includes('hypertrophy') ||
    id.includes('whey') || name.includes('whey') ||
    id.includes('leucine') || name.includes('leucine') ||
    id.includes('bfr') || name.includes('bfr') ||
    id.includes('protein') || name.includes('protein')
  ) {
    profile.isMtorStimulator = true
    profile.primaryCompoundFamily = 'mTORC1 Anabolic Signaling'
  }

  // 7. AMPK Activators & Autophagy Inducers
  if (
    id.includes('berberine') || name.includes('berberine') ||
    id.includes('metformin') || name.includes('metformin') ||
    id.includes('applecider') || name.includes('applecider') || id.includes('acv') ||
    id.includes('fasting') || name.includes('fasting') ||
    id.includes('spermidine') || name.includes('spermidine') ||
    id.includes('rapamycin') || name.includes('rapamycin') ||
    id.includes('zone2') || name.includes('zone2')
  ) {
    profile.isAmpkActivator = true
    profile.primaryCompoundFamily = 'AMPK / Autophagy Activator'
  }

  // 8. GABAergic / Parasympathetic Sedatives
  if (
    id.includes('magnesium') || name.includes('magnesium') ||
    id.includes('taurine') || name.includes('taurine') ||
    id.includes('glycine') || name.includes('glycine') ||
    id.includes('ltheanine') || name.includes('ltheanine') ||
    id.includes('apigenin') || name.includes('apigenin') ||
    id.includes('gaba') || name.includes('gaba') ||
    id.includes('478') || name.includes('478') ||
    id.includes('mouthtaping') || name.includes('mouthtaping') ||
    id.includes('sleep') || cat.includes('sleep')
  ) {
    profile.isGabaergicSedative = true
    profile.primaryCompoundFamily = 'GABAergic / Sleep Enhancer'
  }

  // 9. Central Nervous System Stimulants
  if (
    id.includes('caffeine') || name.includes('caffeine') ||
    id.includes('coffee') || name.includes('coffee') ||
    id.includes('preworkout') || name.includes('preworkout') ||
    id.includes('modafinil') || id.includes('tyrosine') || name.includes('tyrosine') ||
    id.includes('cordyceps') || name.includes('cordyceps')
  ) {
    profile.isCentralStimulant = true
    profile.primaryCompoundFamily = 'CNS / Adenosine Antagonist'
  }

  // 10. Thermal Cold Hormesis
  if (
    id.includes('cold') || name.includes('cold') ||
    id.includes('icebath') || name.includes('icebath') ||
    id.includes('cryotherapy') || name.includes('cryotherapy')
  ) {
    profile.isColdHormesis = true
    profile.primaryCompoundFamily = 'Cold Shock Protein (RBM3) Hormesis'
  }

  // 11. Thermal Heat Hormesis
  if (
    id.includes('sauna') || name.includes('sauna') ||
    id.includes('hyperthermic') || name.includes('hyperthermic') ||
    id.includes('hotbath') || name.includes('hotbath')
  ) {
    profile.isHeatHormesis = true
    profile.primaryCompoundFamily = 'Heat Shock Protein (HSP70) Hormesis'
  }

  // 12. Senolytic Pulse
  if (
    id.includes('fisetin') || name.includes('fisetin') ||
    id.includes('quercetin') || name.includes('quercetin') ||
    id.includes('dasatinib') || id.includes('senolytic') || name.includes('senolytic')
  ) {
    profile.isSenolyticPulse = true
    profile.primaryCompoundFamily = 'Pulsed Senolytic Cleanser'
  }

  // 13. Nitric Oxide & Endothelial Boosters
  if (
    id.includes('citrulline') || name.includes('citrulline') ||
    id.includes('beetroot') || name.includes('beetroot') ||
    id.includes('nitrate') || name.includes('nitrate') ||
    id.includes('arginine') || name.includes('arginine') ||
    id.includes('cocoa') || name.includes('cocoa')
  ) {
    profile.isNitricOxideBooster = true
    profile.primaryCompoundFamily = 'eNOS / Nitric Oxide Vasodilator'
  }

  // 14. Mitochondrial Electron Transport Activators
  if (
    id.includes('redlight') || name.includes('redlight') || id.includes('photobiomodulation') ||
    id.includes('methyleneblue') || name.includes('methyleneblue') ||
    id.includes('pqq') || name.includes('pqq') ||
    id.includes('shilajit') || name.includes('shilajit') ||
    id.includes('coq10') || name.includes('coq10') || id.includes('ubiquinol')
  ) {
    profile.isMitochondrialOxidase = true
    profile.primaryCompoundFamily = 'Mitochondrial ETC Complex Activator'
  }

  // 15. Prolonged Fasting
  if (
    id.includes('186') || id.includes('204') || id.includes('omad') ||
    id.includes('24h') || id.includes('36h') || id.includes('72h') ||
    id.includes('waterfast') || name.includes('water fast') || name.includes('autophagy fast')
  ) {
    profile.isProlongedFast = true
    profile.primaryCompoundFamily = 'Prolonged Autophagy Fast'
  }

  // 16. Postprandial Metabolic Clearance
  if (
    id.includes('soleus') || name.includes('soleus') ||
    id.includes('postmeal') || name.includes('post-meal') || name.includes('postmeal') ||
    id.includes('macrosequencing') || name.includes('sequencing')
  ) {
    profile.isPostprandialMetabolic = true
    profile.primaryCompoundFamily = 'Postprandial Glycemic GDA'
  }

  // 17. Cholinergic Nootropic
  if (
    id.includes('alphagpc') || name.includes('alpha-gpc') || name.includes('alphagpc') ||
    id.includes('cdpcholine') || id.includes('citicoline') ||
    id.includes('uridine') || name.includes('uridine') ||
    id.includes('huperzine') || name.includes('huperzine')
  ) {
    profile.isCholinergicNootropic = true
    profile.primaryCompoundFamily = 'Cholinergic Synaptic Nootropic'
  }

  return profile
}
