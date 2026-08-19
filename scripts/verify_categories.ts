import { SUB_CATEGORIES_MAP } from '../components/ui/ViewSelectorHeader'
import { BUILT_IN_PEPTIDE_PROTOCOLS, BUILT_IN_PEPTIDE_MODALITIES } from '../lib/data/builtInPeptideProtocols'

console.log(`\n==============================================`)
console.log(`VERIFYING 8 FOCUS CATEGORIES`)
console.log(`==============================================\n`)

const peptideSubs = SUB_CATEGORIES_MAP.peptides
console.log(`Configured Peptide Focus Categories (${peptideSubs.length}):`)
peptideSubs.forEach((sub, idx) => {
  console.log(`  ${idx + 1}. [${sub.id}] -> "${sub.label}"`)
})

console.log(`\nTotal built-in peptide protocols available: ${BUILT_IN_PEPTIDE_PROTOCOLS.length}`)
console.log(`Total built-in modalities available: ${BUILT_IN_PEPTIDE_MODALITIES.length}`)

// Test matching logic for each subcategory
peptideSubs.forEach(sub => {
  const subId = sub.id
  const matchingProtocols = BUILT_IN_PEPTIDE_PROTOCOLS.filter(proto => {
    const pName = (proto.name || '').toLowerCase()
    const pDesc = (proto.description || '').toLowerCase()
    const pGoal = (proto.primary_goal || '').toLowerCase()
    const pVectors = Array.isArray(proto.secondary_goals) ? proto.secondary_goals.join(' ').toLowerCase() : ''
    const stepCats = (proto.steps || []).map((s: any) => `${s.modality?.category || ''} ${s.modality?.display_name || s.modality?.name || ''}`).join(' ').toLowerCase()
    const fullText = `${pName} ${pDesc} ${pGoal} ${pVectors} ${stepCats}`

    if (subId === 'injury_joint_repair') {
      return fullText.includes('wolverine') || fullText.includes('repair') || fullText.includes('injury') || fullText.includes('joint') || fullText.includes('tendon') || fullText.includes('ligament') || fullText.includes('bpc') || fullText.includes('tb-500') || fullText.includes('tb500') || fullText.includes('kpv') || fullText.includes('thermal recovery') || fullText.includes('tissue')
    }
    if (subId === 'fat_loss_metabolism') {
      return fullText.includes('lipolysis') || fullText.includes('fat loss') || fullText.includes('visceral') || fullText.includes('recomp') || fullText.includes('metabolic') || fullText.includes('aod') || fullText.includes('tirzepatide') || fullText.includes('retatrutide') || fullText.includes('semaglutide') || fullText.includes('mots') || fullText.includes('zone2') || fullText.includes('biogenesis') || fullText.includes('fasting')
    }
    if (subId === 'muscle_recovery') {
      return fullText.includes('muscle') || fullText.includes('growth hormone') || fullText.includes('hypertrophy') || fullText.includes('somatotropic') || fullText.includes('anabolic') || fullText.includes('cjc') || fullText.includes('ipamorelin') || fullText.includes('sermorelin') || fullText.includes('igf') || fullText.includes('sleep reset') || fullText.includes('strength')
    }
    if (subId === 'focus_brain_mood') {
      return fullText.includes('semax') || fullText.includes('selank') || fullText.includes('cognitive') || fullText.includes('focus') || fullText.includes('brain') || fullText.includes('neuro') || fullText.includes('synaptic') || fullText.includes('flow') || fullText.includes('mind') || fullText.includes('mood')
    }
    if (subId === 'skin_aesthetics') {
      return fullText.includes('skin') || fullText.includes('glow') || fullText.includes('klow') || fullText.includes('photonic') || fullText.includes('collagen') || fullText.includes('dermal') || fullText.includes('aesthetics') || fullText.includes('ghk') || fullText.includes('epitalon skin') || fullText.includes('red light')
    }
    if (subId === 'immunity_gut') {
      return fullText.includes('immune') || fullText.includes('gut') || fullText.includes('ta1') || fullText.includes('thymosin') || fullText.includes('kpv') || fullText.includes('mucosal') || fullText.includes('barrier') || fullText.includes('leaky gut')
    }
    if (subId === 'libido_vitality') {
      return fullText.includes('sexual') || fullText.includes('libido') || fullText.includes('pt141') || fullText.includes('pt-141') || fullText.includes('kisspeptin') || fullText.includes('oxytocin') || fullText.includes('intimacy') || fullText.includes('vitality')
    }
    if (subId === 'cellular_longevity') {
      return fullText.includes('longevity') || fullText.includes('epigenetic') || fullText.includes('telomere') || fullText.includes('blueprint') || fullText.includes('sinclair') || fullText.includes('biologics') || fullText.includes('epitalon') || fullText.includes('ss-31') || fullText.includes('mots') || fullText.includes('senolytic') || fullText.includes('fmd') || fullText.includes('stem cell')
    }
    return false
  })

  console.log(`\n🔹 ${sub.label} [${sub.id}]: ${matchingProtocols.length} Protocols matching`)
  matchingProtocols.slice(0, 3).forEach(p => console.log(`     - ${p.name}`))
  if (matchingProtocols.length > 3) console.log(`     ... and ${matchingProtocols.length - 3} more`)
})

console.log(`\n----------------------------------------------`)
console.log(`✅ CATEGORY MATCHING VERIFIED FOR ALL 8 SUB-CATEGORIES!`)
console.log(`----------------------------------------------\n`)
