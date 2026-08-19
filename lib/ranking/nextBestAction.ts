import { Modality, UserProfile } from '../types'
import {
  getEffortMetadata,
  getCostMetadata,
  getSafetyMetadata,
  evaluateModalityLongevity
} from './adaptiveRecommendationEngine'

export type NbaContext = {
  biomarkers?: Record<string, { raw_value: number; normalized_value: number; lab_flag?: string }>
  physiologicalTests?: Record<string, { score: number; flag?: string }>
}

/**
 * Calculates the Next Best Action score, match percentage, and personalized reasons.
 * Incorporates:
 * 1. Multi-Dimensional Longevity Impact (Base Benefit, Evidence Quality, Effect Size, Safety Level)
 * 2. User Functional Outcome Goals & Synergies
 * 3. 1–5 Effort Rating Friction Penalties & Time Optimization
 * 4. Baseline Negative Longevity Factors & Counter-Protocols (Sedentary, Alcohol, Caffeine, Smoking, Blue Light, Sugar)
 * 5. Bloodwork Lab Biomarkers (ApoB, hs-CRP, HbA1c, Vitamin D3)
 * 6. Physiological Age Assessment Sub-Scores (Balance, Grip Strength, Chair Stand, Reaction Time)
 * 7. Hard Profile Conflicts & Cost Budget Constraints
 */
export function calculateNextBestAction(
  modality: Modality, 
  userProfile: UserProfile | null,
  context?: NbaContext
) {
  if (!modality) return { score: 0, matchPercentage: 0, reasons: [] };
  
  const coef = userProfile?.longevity_personalization_coefficient || 1.0;
  const reasons: string[] = [];
  const evalData = evaluateModalityLongevity(modality, userProfile);
  
  const modText = (
    (modality.name || '') + ' ' + 
    (modality.display_name || '') + ' ' + 
    (modality.headline_benefit || '') + ' ' + 
    (modality.mechanism_of_action || '') + ' ' + 
    (modality.category || '') + ' ' + 
    (modality.id || '')
  ).toLowerCase();

  // --- Signal 1: Multi-Dimensional Longevity Impact (Up to 35 points) ---
  const baseBenefit = evalData.longevityImpactScore; // Composite 0-10 based on Evidence, Effect Size, Safety
  let score = baseBenefit * 3.5 * coef; 
  
  if (baseBenefit >= 7.5) {
    reasons.push(`High Longevity Impact Score (${baseBenefit}/10).`);
  }

  // --- Signal 2: Functional Outcome Preferences (Up to 40 points) ---
  let outcomePreferenceBonus = 0;
  if (userProfile?.outcome_preference_scores && modality.functional_impacts) {
    let topMatchedOutcome = '';
    let topMatchedScore = 0;

    Object.entries(modality.functional_impacts).forEach(([outcomeName, impactData]) => {
      const normalizedOutcomeName = outcomeName.toLowerCase().replace(/\s+/g, '_');
      const userPref = userProfile.outcome_preference_scores![normalizedOutcomeName];
      
      // Check if userPref is a numeric rating (1-10)
      if (typeof userPref === 'number' && userPref > 4) { 
        const synergy = (userPref / 10) * (impactData.score / 10) * 40;
        outcomePreferenceBonus += synergy;

        if (synergy > topMatchedScore) {
          topMatchedScore = synergy;
          topMatchedOutcome = outcomeName;
        }
      }
    });

    if (topMatchedOutcome) {
      const displayOutcome = topMatchedOutcome.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      reasons.push(`Directly targets your goal for better ${displayOutcome}.`);
    }
  }
  score += Math.min(40, outcomePreferenceBonus);

  // --- Signal 3: Primary Goals Text Alignment (Up to 15 points) ---
  if (userProfile?.primary_goals && userProfile.primary_goals.length > 0) {
    userProfile.primary_goals.forEach(goal => {
      if (modText.includes(goal.toLowerCase())) {
        score += 15;
        if (!reasons.some(r => r.includes(goal))) {
          reasons.push(`Aligns with your primary goal: "${goal}".`);
        }
      }
    });
  }

  // --- Signal 4: Baseline Negative Longevity Factors & Counter-Protocols (Up to 35 points) ---
  if (userProfile?.outcome_preference_scores) {
    const prefs = userProfile.outcome_preference_scores;

    // 🪑 1. Sedentary / Prolonged Sitting
    const negSitting = String(prefs['neg_sitting'] || '');
    if (['4_7h', '8_10h', 'over_10h', 'heavy', 'frequent'].includes(negSitting)) {
      const isMovement = modText.includes('cardio') || modText.includes('zone 2') || modText.includes('resistance') || modText.includes('walk') || modText.includes('strength') || modText.includes('mobility') || modText.includes('sitting-rising');
      if (isMovement) {
        score += 25;
        reasons.push('Counteracts daily sedentary sitting time by boosting muscle LPL & GLUT4 insulin sensitivity.');
      }
    }

    // ☕ 2. Late Afternoon Caffeine
    const negCaffeine = String(prefs['neg_caffeine'] || '');
    if (['frequent', 'daily', '2_plus', '1_cup'].includes(negCaffeine)) {
      const isSleepProtector = modText.includes('magnesium') || modText.includes('apigenin') || modText.includes('glycine') || modText.includes('sleep') || modText.includes('nsdr') || modText.includes('wind-down');
      if (isSleepProtector) {
        score += 25;
        reasons.push('Protects slow-wave deep sleep against late afternoon caffeine receptor blockade.');
      }
    }

    // 🍷 3. Alcohol Exposure
    const negAlcohol = String(prefs['neg_alcohol'] || '');
    if (['occasional', 'moderate', 'heavy', 'frequent'].includes(negAlcohol)) {
      const isDetoxOrRecovery = modText.includes('nac') || modText.includes('milk thistle') || modText.includes('glutathione') || modText.includes('electrolyte') || modText.includes('sauna') || modText.includes('hydration');
      if (isDetoxOrRecovery) {
        score += 25;
        reasons.push('Mitigates alcohol-induced REM sleep fragmentation & hepatic oxidative stress.');
      }
    }

    // 📱 4. Late Night Blue Light & Screens
    const negScreens = String(prefs['neg_screens'] || '');
    if (['moderate', 'high'].includes(negScreens)) {
      const isCircadianShield = modText.includes('blue blocker') || modText.includes('red light') || modText.includes('melatonin') || modText.includes('dimming') || modText.includes('light');
      if (isCircadianShield) {
        score += 25;
        reasons.push('Shields your melatonin surge & suprachiasmatic nucleus from late night screen exposure.');
      }
    }

    // 🍕 5. Ultra-Processed Foods & Refined Sugars
    const negSugar = String(prefs['neg_sugar'] || '');
    if (['moderate', 'high'].includes(negSugar)) {
      const isGlucoseClearing = modText.includes('berberine') || modText.includes('fasting') || modText.includes('time-restricted') || modText.includes('walk') || modText.includes('zone 2');
      if (isGlucoseClearing) {
        score += 25;
        reasons.push('Accelerates postprandial glucose clearance & mitigates Advanced Glycation End-products (AGEs).');
      }
    }

    // 🚬 6. Nicotine & Smoking
    const negNicotine = String(prefs['neg_nicotine'] || '');
    if (['cigarettes', 'vaping', 'pouches'].includes(negNicotine)) {
      const isEndothelialSupport = modText.includes('vitamin c') || modText.includes('sauna') || modText.includes('coq10') || modText.includes('breathwork');
      if (isEndothelialSupport) {
        score += 25;
        reasons.push('Supports vascular endothelial repair & combats tobacco-induced oxidative stress.');
      }
    }
  }

  // --- Signal 5: Bloodwork & Lab Biomarkers Integration (Up to 35 points) ---
  if (context?.biomarkers) {
    const b = context.biomarkers;

    // ApoB / Cholesterol
    if (b['apob']?.raw_value > 90 || b['apob']?.lab_flag === 'high' || b['ldl_c']?.raw_value > 120) {
      if (modText.includes('berberine') || modText.includes('fiber') || modText.includes('cardio') || modText.includes('zone 2') || modText.includes('red yeast')) {
        score += 30;
        reasons.push('Biomarker Match: Directly targets your elevated ApoB / atherogenic particle count.');
      }
    }

    // Inflammation (hs-CRP)
    if (b['crp']?.raw_value > 1.5 || b['hs_crp']?.raw_value > 1.5 || b['crp']?.lab_flag === 'high') {
      if (modText.includes('omega-3') || modText.includes('fish oil') || modText.includes('curcumin') || modText.includes('cold') || modText.includes('sauna')) {
        score += 30;
        reasons.push('Biomarker Match: Clinically proven to reduce systemic hs-CRP inflammation.');
      }
    }

    // Glycemia / HbA1c
    if (b['hba1c']?.raw_value > 5.6 || b['fasting_glucose']?.raw_value > 99 || b['fasting_insulin']?.raw_value > 8) {
      if (modText.includes('berberine') || modText.includes('fasting') || modText.includes('walk') || modText.includes('zone 2')) {
        score += 30;
        reasons.push('Biomarker Match: Helps lower HbA1c & restore insulin sensitivity.');
      }
    }

    // Vitamin D3
    if (b['vitamin_d']?.raw_value < 30 || b['vitamin_d']?.lab_flag === 'low') {
      if (modText.includes('vitamin d') || modText.includes('d3') || modText.includes('sunlight')) {
        score += 35;
        reasons.push('Biomarker Match: Crucial to correct your deficient Vitamin D3 blood levels.');
      }
    }
  }

  // --- Signal 6: Physiological Age & Physical Assessment Integration (Up to 25 points) ---
  if (context?.physiologicalTests) {
    const p = context.physiologicalTests;

    if (p['balance']?.score < 6 || p['balance']?.flag === 'low') {
      if (modText.includes('balance') || modText.includes('proprioception') || modText.includes('single-leg')) {
        score += 25;
        reasons.push('Functional Match: Improves single-leg balance & neuromuscular stability.');
      }
    }

    if (p['grip_strength']?.score < 30 || p['grip_strength']?.flag === 'low') {
      if (modText.includes('grip') || modText.includes('resistance') || modText.includes('strength') || modText.includes('dead hang')) {
        score += 25;
        reasons.push('Functional Match: Targets low hand grip strength & upper body musculoskeletal capacity.');
      }
    }

    if (p['chair_stand']?.score < 14 || p['chair_stand']?.flag === 'low') {
      if (modText.includes('squat') || modText.includes('resistance') || modText.includes('zone 2') || modText.includes('leg')) {
        score += 25;
        reasons.push('Functional Match: Builds lower body power & 30-second chair stand capacity.');
      }
    }
  }

  // --- Signal 7: Biomarker & Demographic Personalization ---
  if (userProfile) {
    // Body Fat
    if (userProfile.body_fat_percentage != null) {
      const isWeightLossDrug = modText.includes('glp-1') || modText.includes('acarbose') || modText.includes('semaglutide') || modText.includes('tirzepatide');
      
      if (userProfile.body_fat_percentage < 15 && isWeightLossDrug) {
        score -= 40; // Heavy penalty
        reasons.push('Not recommended: Your body fat percentage is already optimal.');
      } else if (userProfile.body_fat_percentage > 25) {
        score += 15;
        reasons.push('Highly effective for improving metabolic health and body composition.');
      }
    }

    // Age
    if (userProfile.age != null) {
      const isAgingTool = modText.includes('nad') || modText.includes('nmn') || modText.includes('nr') || modText.includes('rapamycin') || modText.includes('senolytic') || modText.includes('joint');
      
      if (userProfile.age > 35 && isAgingTool) {
        score += 15;
        reasons.push('Highly recommended to support healthy cellular aging in your current decade.');
      } else if (userProfile.age < 30 && isAgingTool) {
        score -= 20;
        reasons.push('Unnecessary at your current biological age.');
      }
    }

    // Biological Sex
    if (userProfile.biological_sex) {
      const sex = userProfile.biological_sex.toLowerCase();
      const isTestosteroneBooster = modText.includes('testosterone') || modText.includes('tongkat ali') || modText.includes('fadogia');
      const isBoneDensityTool = modText.includes('bone density') || modText.includes('k2') || modText.includes('collagen');
      
      if (sex === 'female') {
        if (isTestosteroneBooster) {
          score -= 50;
          reasons.push('Not recommended due to biological sex unless directed by a physician.');
        }
        if (isBoneDensityTool && (userProfile.age || 0) > 40) {
          score += 15;
          reasons.push('Crucial for protecting female bone density as you age.');
        }
      }
    }

    // Sleep Quality Baseline
    if (userProfile.baseline_sleep_quality_0_10 != null && userProfile.baseline_sleep_quality_0_10 < 6) {
      if (modText.includes('sleep') || modality.primary_outcome === 'sleep_quality') {
        score += 20;
        reasons.push('Highly recommended to address your low baseline sleep quality.');
      }
    }
  }

  // --- Signal 8: Hard Profile Conflict Penalties (Demote Over-Budget Treatments) ---
  if (userProfile?.weekly_spend_budget_usd != null) {
    const budget = userProfile.weekly_spend_budget_usd;
    if (modality.cost_tier === 'premium' && budget < 100) {
      score -= 70; // Heavy demotion penalty for plasmapheresis / premium tools over budget
      reasons.push('Profile Conflict: Exceeds your weekly spend budget constraint.');
    } else if (modality.cost_tier === 'high' && budget < 50) {
      score -= 50;
      reasons.push('High cost compared to your budget preference.');
    }
  }

  if (userProfile?.discipline_level_0_99 != null) {
    const discipline = userProfile.discipline_level_0_99;
    if (modality.effort_level === 'very_high' && discipline < 50) {
      score -= 30;
      reasons.push('Requires more discipline than you prefer.');
    }
  }

  if (userProfile?.weekly_time_budget_hours != null) {
    const hrs = userProfile.weekly_time_budget_hours;
    if (modality.effort_level === 'very_high' && hrs < 5) {
      score -= 30;
      reasons.push('Might exceed your available time budget.');
    }
  }

  if (userProfile?.experimental_openness_0_99 != null) {
    const openness = userProfile.experimental_openness_0_99;
    const evidenceScore = modality.evidence_quality || 3; 
    
    if (openness < 30 && evidenceScore < 3) {
      score -= 40;
      reasons.push('Lacks the proven clinical evidence you prefer.');
    } else if (openness > 70 && evidenceScore < 3) {
      score += 10;
      reasons.push('Matches your openness to cutting-edge science.');
    }
  }

  if (userProfile?.risk_tolerance != null) {
    const riskTolerance = userProfile.risk_tolerance; 
    if (riskTolerance === 'low_risk' && modality.safety_level === 'high_risk') {
      score -= 60;
      reasons.push('Profile Conflict: Exceeds your specified risk tolerance.');
    }
  }

  // --- Ensure minimum reasons ---
  if (reasons.length === 0) {
    reasons.push('Solid foundational choice for general wellness.');
  }

  // --- Match Percentage UX Calibration (15% to 98%) ---
  // Clamp raw score into realistic 15% to 98% range
  let matchPercentage: number;
  if (score <= 0) {
    matchPercentage = Math.round(Math.max(12, 25 + score)); // Demoted conflicts stay in 12%-35% range
  } else if (score < 25) {
    matchPercentage = Math.round(35 + (score / 25) * 20); // 35% - 55%
  } else if (score < 60) {
    matchPercentage = Math.round(55 + ((score - 25) / 35) * 25); // 55% - 80%
  } else {
    matchPercentage = Math.round(80 + Math.min(18, ((score - 60) / 40) * 18)); // 80% - 98%
  }

  return { 
    score: Math.max(0, score), 
    matchPercentage, 
    reasons: reasons.slice(0, 3) // Keep top 3 reasons
  };
}

/**
 * Mutates and sorts the modalities array by Next Best Action score.
 * Attaches the nba_result to each modality object.
 */
export function sortModalitiesByNBA(
  modalities: Modality[], 
  userProfile: UserProfile | null,
  context?: NbaContext
): Modality[] {
  const enhanced = modalities.map(mod => {
    const result = calculateNextBestAction(mod, userProfile, context);
    return { ...mod, nba_result: result };
  });

  return enhanced.sort((a, b) => (b.nba_result?.score || 0) - (a.nba_result?.score || 0));
}

export function getSwapAlternatives(
  failingModality: Modality, 
  targetOutcome: string, 
  allModalities: Modality[], 
  activeModalityIds: Set<string>, 
  userProfile: UserProfile | null,
  enforceLowerEffort: boolean = true,
  context?: NbaContext
): Modality[] {
  const effortScores: Record<string, number> = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'very_high': 4
  }

  const failingEffortScore = effortScores[failingModality.effort_level || 'low'] || 1

  let candidates = allModalities.filter(m => {
    if (m.id === failingModality.id) return false;
    if (activeModalityIds.has(m.id)) return false;

    const targetsOutcome = m.functional_impacts && Object.keys(m.functional_impacts).some(k => k.toLowerCase().replace(/\s+/g, '_') === targetOutcome)
    if (!targetsOutcome) return false;

    if (enforceLowerEffort) {
      const candidateEffortScore = effortScores[m.effort_level || 'low'] || 1
      if (candidateEffortScore >= failingEffortScore && failingEffortScore > 1) {
        return false;
      }
    }

    return true;
  })

  return sortModalitiesByNBA(candidates, userProfile, context)
}

