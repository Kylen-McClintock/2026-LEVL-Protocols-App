import { LONGEVITY_TIPS, LongevityTip } from '@/lib/data/longevityTips'
import { UserProfile, DailyProtocolTask } from '@/lib/types'

export interface ScoredLongevityTip {
  tip: LongevityTip
  score: number
  relevanceReason: string
  isInTodayStack: boolean
  todayTaskId?: string
}

function getDateSeed(dateStr?: string): number {
  if (!dateStr) return 0
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getScoredLongevityTips(
  userProfile?: UserProfile | null,
  todaysCheckin?: { energy?: number; stress?: number; sleep_quality?: number; mood?: number; brain_fog?: number },
  todaysTasks: DailyProtocolTask[] = [],
  dismissedTipIds: string[] = [],
  dateStr?: string
): ScoredLongevityTip[] {
  const currentHour = new Date().getHours()
  let timeOfDay: 'morning' | 'afternoon' | 'evening' = 'morning'
  if (currentHour >= 12 && currentHour < 18) timeOfDay = 'afternoon'
  else if (currentHour >= 18) timeOfDay = 'evening'

  // Map today's active modality IDs
  const activeModalityIds = new Set(
    todaysTasks.map(t => t.modality_id || t.protocol_step?.modality_id || t.loose_modality?.id).filter(Boolean)
  )

  const userGoals = (userProfile?.primary_goals || []).map(g => g.toLowerCase())
  const dateSeed = getDateSeed(dateStr)

  const scored = LONGEVITY_TIPS.map((tip, idx) => {
    let score = 50 // Base score
    const reasons: string[] = []

    // Date-specific deterministic rotation (0 to 30 pts)
    const dateBonus = dateSeed > 0 ? ((dateSeed + idx * 7) % LONGEVITY_TIPS.length) * 2 : 0
    score += dateBonus

    const mId = tip.modality_id
    const matchingTask = todaysTasks.find(t => 
      (mId && (t.modality_id === mId || t.protocol_step?.modality_id === mId || t.loose_modality?.id === mId))
    )
    const isInTodayStack = !!matchingTask

    // 1. Check-in & Symptom Signal Matching (+40 pts)
    if (todaysCheckin) {
      const { energy, stress, sleep_quality, brain_fog } = todaysCheckin

      if (tip.target_symptom === 'energy' && energy !== undefined && energy <= 4) {
        score += 40
        reasons.push('Tailored to low energy on this day')
      } else if (tip.target_symptom === 'stress' && stress !== undefined && stress >= 7) {
        score += 40
        reasons.push('Matched to reduce high stress on this day')
      } else if (tip.target_symptom === 'sleep_quality' && sleep_quality !== undefined && sleep_quality <= 4) {
        score += 40
        reasons.push('Recommended to improve low sleep rating')
      } else if (tip.target_symptom === 'brain_fog' && brain_fog !== undefined && brain_fog >= 6) {
        score += 35
        reasons.push('Selected for cognitive focus & brain fog clearance')
      }
    }

    // 2. Primary Goal Matching (+30 pts)
    if (userGoals.length > 0 && tip.primary_goal_match) {
      const matchesGoal = tip.primary_goal_match.some(gm => 
        userGoals.some(ug => ug.includes(gm) || gm.includes(ug))
      )
      if (matchesGoal) {
        score += 30
        reasons.push('Aligned with your longevity primary focus')
      }
    }

    // 3. Stack Actionability (+20 pts for discovery of new modalities)
    if (!isInTodayStack && mId) {
      score += 20
      reasons.push('Actionable addition for your daily stack')
    } else if (isInTodayStack) {
      score += 10
      reasons.push('Already in your routine on this day')
    }

    // 4. Time of Day Context (+15 pts)
    if (tip.time_of_day_preference === timeOfDay) {
      score += 15
      reasons.push(`Optimal timing for ${timeOfDay}`)
    }

    // 5. Dismissal Penalty (-500 pts)
    if (dismissedTipIds.includes(tip.id)) {
      score -= 500
    }

    const relevanceReason = reasons[0] || 'Scientific longevity tip of the day'

    return {
      tip,
      score,
      relevanceReason,
      isInTodayStack,
      todayTaskId: matchingTask?.id
    }
  })

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score)
}

export function getTopLongevityTip(
  userProfile?: UserProfile | null,
  todaysCheckin?: { energy?: number; stress?: number; sleep_quality?: number; mood?: number; brain_fog?: number },
  todaysTasks: DailyProtocolTask[] = [],
  dismissedTipIds: string[] = [],
  dateStr?: string
): ScoredLongevityTip | null {
  const list = getScoredLongevityTips(userProfile, todaysCheckin, todaysTasks, dismissedTipIds, dateStr)
  return list.length > 0 ? list[0] : null
}
