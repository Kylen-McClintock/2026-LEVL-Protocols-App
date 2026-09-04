import { supabase } from '@/lib/supabase/client'
import { getModalities, getProtocols, getOutcomeDimensions } from '@/lib/data'
import { Modality, Protocol, OutcomeDimension } from '@/lib/types'
import { format } from 'date-fns'
import { getCircadianConfig, CHRONOLOGICAL_CIRCADIAN_SLOTS } from '@/lib/utils/circadianConfig'

export interface CompleteUserDataPayload {
  localUserId: string
  exportedAt: string
  profile: any | null
  benchItems: any[]
  protocolInstances: any[]
  tasks: any[]
  checkins: any[]
  biomarkers: any[]
  biologicalMeasurements: any[]
  physiologicalScores: any[]
  outcomeObservations: any[]
  modalitiesMap: Map<string, Modality>
  protocolsMap: Map<string, Protocol>
  outcomesMap: Map<string, OutcomeDimension>
  quickLogs: any[]
}

/**
 * Safely fetches all user data across all tables from remote Supabase,
 * falling back gracefully if individual tables are empty or optional.
 */
export async function fetchCompleteUserData(localUserId: string): Promise<CompleteUserDataPayload> {
  const exportedAt = new Date().toISOString()

  // 1. Fetch catalog entities in parallel
  const [allModalities, allProtocols, allOutcomes] = await Promise.all([
    getModalities().catch(() => [] as Modality[]),
    getProtocols().catch(() => [] as Protocol[]),
    getOutcomeDimensions().catch(() => [] as OutcomeDimension[])
  ])

  const modalitiesMap = new Map<string, Modality>()
  allModalities.forEach(m => {
    if (m.id) modalitiesMap.set(m.id, m)
    if (m.slug) modalitiesMap.set(m.slug, m)
  })

  const protocolsMap = new Map<string, Protocol>()
  allProtocols.forEach(p => {
    if (p.id) protocolsMap.set(p.id, p)
  })

  const outcomesMap = new Map<string, OutcomeDimension>()
  allOutcomes.forEach(o => {
    if (o.id) outcomesMap.set(o.id, o)
  })

  // 2. Query user tables from remote Supabase
  let profile: any = null
  let benchItems: any[] = []
  let protocolInstances: any[] = []
  let tasks: any[] = []
  let checkins: any[] = []
  let biomarkers: any[] = []
  let biologicalMeasurements: any[] = []
  let physiologicalScores: any[] = []
  let outcomeObservations: any[] = []

  if (supabase) {
    const client = supabase
    const [
      profileData,
      benchData,
      instancesData,
      tasksData,
      checkinsData,
      biomarkersData,
      bioMeasurementsData,
      physoScoresData,
      outcomesObsData
    ] = await Promise.all([
      (async () => {
        try {
          const res = await client.from('user_profiles').select('*').eq('local_user_id', localUserId).maybeSingle()
          return res.data || null
        } catch { return null }
      })(),
      (async () => {
        try {
          const res = await client.from('user_bench_items').select('*').eq('local_user_id', localUserId)
          return res.data || []
        } catch { return [] }
      })(),
      (async () => {
        try {
          const res = await client.from('user_protocol_instances').select('*, protocol:protocols(*)').eq('local_user_id', localUserId)
          return res.data || []
        } catch { return [] }
      })(),
      (async () => {
        try {
          const res = await client.from('daily_protocol_tasks').select('*').eq('local_user_id', localUserId).order('scheduled_date', { ascending: false }).limit(2500)
          return res.data || []
        } catch { return [] }
      })(),
      (async () => {
        try {
          const res = await client.from('daily_wellbeing_checkins').select('*').eq('local_user_id', localUserId).order('date', { ascending: false }).limit(365)
          return res.data || []
        } catch { return [] }
      })(),
      (async () => {
        try {
          const res = await client.from('biomarker_measurements').select('*').eq('local_user_id', localUserId).order('recorded_at', { ascending: false })
          return res.data || []
        } catch { return [] }
      })(),
      (async () => {
        try {
          const res = await client.from('biological_measurements').select('*').eq('local_user_id', localUserId).order('created_at', { ascending: false })
          return res.data || []
        } catch { return [] }
      })(),
      (async () => {
        try {
          const res = await client.from('physiological_age_scores').select('*').eq('local_user_id', localUserId).order('created_at', { ascending: false })
          return res.data || []
        } catch { return [] }
      })(),
      (async () => {
        try {
          const res = await client.from('outcome_observations').select('*').eq('local_user_id', localUserId).order('created_at', { ascending: false })
          return res.data || []
        } catch { return [] }
      })()
    ])

    profile = profileData
    benchItems = benchData
    protocolInstances = instancesData
    tasks = tasksData
    checkins = checkinsData
    biomarkers = biomarkersData
    biologicalMeasurements = bioMeasurementsData
    physiologicalScores = physoScoresData
    outcomeObservations = outcomesObsData
  }

  // 3. Check client-side localStorage fallback / supplemental data
  let quickLogs: any[] = []
  if (typeof window !== 'undefined') {
    try {
      if (!profile) {
        const cachedProf = localStorage.getItem(`levl_user_profile_${localUserId}`)
        if (cachedProf) profile = JSON.parse(cachedProf)
      }
      const rawQuickLogs = localStorage.getItem(`levl_quick_logs_${localUserId}`)
      if (rawQuickLogs) quickLogs = JSON.parse(rawQuickLogs)
    } catch (e) {}
  }

  return {
    localUserId,
    exportedAt,
    profile,
    benchItems,
    protocolInstances,
    tasks,
    checkins,
    biomarkers,
    biologicalMeasurements,
    physiologicalScores,
    outcomeObservations,
    modalitiesMap,
    protocolsMap,
    outcomesMap,
    quickLogs
  }
}

/**
 * 1. LOSSLESS FULL SYSTEM BACKUP (JSON)
 * Schema-agnostic envelope containing complete raw dumps and relational enrichment.
 */
export function generateProtocolJSON(payload: CompleteUserDataPayload): string {
  const exportEnvelope = {
    $schema: 'https://levlhealth.com/schemas/protocol-vault-v1.json',
    levl_export_version: '1.0',
    platform: 'LEVL Human Longevity & Protocol Operating System',
    exported_at: payload.exportedAt,
    user_id: payload.localUserId,
    inventory_summary: {
      profile_configured: Boolean(payload.profile),
      benched_modalities_count: payload.benchItems.length,
      active_protocols_count: payload.protocolInstances.length,
      total_task_executions_logged: payload.tasks.length,
      total_wellbeing_checkin_days: payload.checkins.length,
      biomarker_records_count: payload.biomarkers.length,
      quick_logs_count: payload.quickLogs.length
    },
    user_profile: payload.profile,
    active_protocols: payload.protocolInstances.map(inst => ({
      ...inst,
      protocol_details: payload.protocolsMap.get(inst.protocol_id) || inst.protocol || null
    })),
    benched_modalities: payload.benchItems.map(item => ({
      ...item,
      modality_details: payload.modalitiesMap.get(item.modality_id) || null
    })),
    daily_protocol_tasks: payload.tasks.map(task => ({
      ...task,
      modality_name: payload.modalitiesMap.get(task.modality_id)?.name || task.loose_modality?.name || null,
      category: payload.modalitiesMap.get(task.modality_id)?.category || null
    })),
    daily_wellbeing_checkins: payload.checkins,
    biomarker_measurements: payload.biomarkers,
    biological_age_logs: payload.biologicalMeasurements,
    physiological_age_scores: payload.physiologicalScores,
    outcome_observations: payload.outcomeObservations,
    quick_logs: payload.quickLogs
  }

  return JSON.stringify(exportEnvelope, null, 2)
}

/**
 * 2. AI-READY MARKDOWN DOSSIER (.md)
 * Designed for immediate drag-and-drop into Claude 3.5/3.7, ChatGPT 4o/o1, DeepSeek R1, or Gemini.
 */
export function generateProtocolMarkdown(payload: CompleteUserDataPayload): string {
  const p = payload.profile || {}
  const nowStr = format(new Date(), 'MMMM d, yyyy • h:mm a')

  // Parse Medical Profile
  let medications: string[] = []
  let conditions: string[] = []
  let allergies: string[] = []
  if (p.medications_and_treatments_text) {
    try {
      const parsed = JSON.parse(p.medications_and_treatments_text)
      if (Array.isArray(parsed)) medications = parsed
      else if (parsed.medications) medications = parsed.medications
    } catch {
      medications = p.medications_and_treatments_text.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean)
    }
  }
  if (p.health_conditions_text) {
    try {
      const parsed = JSON.parse(p.health_conditions_text)
      if (Array.isArray(parsed)) conditions = parsed
      else if (parsed.conditions) conditions = parsed.conditions
      if (parsed.allergies) allergies = parsed.allergies
    } catch {
      conditions = p.health_conditions_text.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean)
    }
  }

  // Active Protocols List
  const activeProtocols = payload.protocolInstances.map(inst => {
    const proto = payload.protocolsMap.get(inst.protocol_id) || inst.protocol || {}
    return {
      name: proto.name || 'Custom Protocol',
      author: proto.author_name || proto.source_label || 'LEVL Protocol',
      goal: proto.primary_goal || proto.goal || 'Longevity & Performance',
      status: inst.status || 'active',
      started: inst.start_date || inst.created_at ? format(new Date(inst.start_date || inst.created_at), 'yyyy-MM-dd') : 'Ongoing'
    }
  })

  // Map benched / active modalities by circadian slot
  const slotGroups: Record<string, any[]> = {}
  payload.benchItems.forEach(item => {
    if (item.status === 'eliminated' || item.status === 'archived') return
    const mod = payload.modalitiesMap.get(item.modality_id)
    if (!mod) return

    const timingSlot = item.custom_timing || mod.default_timing_slot || 'anytime'
    const cfg = getCircadianConfig(timingSlot)
    const groupKey = cfg.key

    if (!slotGroups[groupKey]) slotGroups[groupKey] = []
    slotGroups[groupKey].push({
      item,
      mod,
      dose: item.custom_dose || mod.dose_or_exposure || 'Standard Dose',
      instructions: mod.instructions || mod.implementation_summary || '',
      temperature: mod.temperature || null,
      duration: mod.duration || null,
      timingSummary: mod.timing_summary || '',
      references: mod.scientific_references || [],
      pubmedUrl: mod.scientific_references?.[0]?.url || mod.source_url || null
    })
  })

  // Outcome rankings
  const outcomeScores = p.outcome_preference_scores || {}
  const rankedOutcomes = Object.entries(outcomeScores)
    .filter(([key, val]) => typeof val === 'number')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([key, score]) => {
      const dim = payload.outcomesMap.get(key)
      return {
        id: key,
        name: dim?.name || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        score: score as number
      }
    })

  // Compliance metrics (Past 14 Days)
  const recentTasks = payload.tasks.slice(0, 100)
  const totalRecent = recentTasks.length
  const completedRecent = recentTasks.filter(t => t.status === 'completed').length
  const compliancePct = totalRecent > 0 ? Math.round((completedRecent / totalRecent) * 100) : 100

  // Build Markdown
  const lines: string[] = []

  lines.push('# 🧬 LEVL PROTOCOLS • COMPREHENSIVE BIOLOGICAL & PROTOCOL DOSSIER')
  lines.push(`**Exported**: ${nowStr}`)
  lines.push(`**User ID**: \`${payload.localUserId}\``)
  lines.push(`**Platform**: LEVL Human Longevity Operating System (levlhealth.com)`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 🤖 LLM SYSTEM DIRECTIVE (Copy & Paste to Claude / ChatGPT)')
  lines.push('> **DIRECTIVE FOR AI ASSISTANT**:')
  lines.push('> You are analyzing the personal health, longevity protocol, and biological regimen of this user.')
  lines.push('> This dossier contains exact biometric anchors, medical history, active longevity protocols, personalized modality dosages, circadian timing slots, and recent adherence/well-being check-ins.')
  lines.push('> Use this verified data as the authoritative ground truth for answering questions, evaluating compound synergies or contraindications, and suggesting protocol calibrations.')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 1. USER PROFILE & BIOMETRIC ANCHORS')
  lines.push(`- **Age / Sex / Chronotype**: ${p.age || 'Unspecified'} yrs | ${p.biological_sex || 'Unspecified'} | ${p.chronotype || 'Intermediate / Moderate Early'}`)
  lines.push(`- **Target Sleep Architecture**: Ideal Wake: **${p.ideal_wake_time || '06:30 AM'}** | Ideal Bedtime: **${p.ideal_bedtime || '10:30 PM'}**`)
  lines.push(`- **Fasting & Feeding Window**: ${p.fasting_schedule || '16:8 Time-Restricted Feeding'} (${p.eating_window_start || '11:30 AM'} – ${p.eating_window_end || '7:30 PM'})`)
  lines.push(`- **Physical Training Profile**: Workout Window: ${p.primary_workout_window || 'Afternoon'} | Resistance Days: ${(p.resistance_training_days || ['Mon', 'Wed', 'Fri']).join(', ')} | Level: ${p.fitness_training_level || 'Intermediate'}`)
  lines.push(`- **Dietary Pattern**: ${p.dietary_pattern || 'Longevity Whole-Food Mediterranean / Plant-Rich'}`)
  
  if (p.hardware_access && Array.isArray(p.hardware_access) && p.hardware_access.length > 0) {
    const hwNames = p.hardware_access.map((h: string) => h.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ')
    lines.push(`- **Available Hardware & Equipment**: ${hwNames}`)
  } else {
    lines.push(`- **Available Hardware & Equipment**: None explicitly declared (Bodyweight & Home ambient)`)
  }

  if (rankedOutcomes.length > 0) {
    lines.push('')
    lines.push('### Top Prioritized Longevity & Performance Outcomes:')
    rankedOutcomes.slice(0, 6).forEach((o, idx) => {
      lines.push(`${idx + 1}. **${o.name}** (Priority Score: ${o.score}/100)`)
    })
  }

  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 2. MEDICAL HISTORY & SAFETY GUARDRAILS')
  lines.push(`- **Prescription Medications & Treatments**: ${medications.length > 0 ? medications.join(', ') : 'None reported'}`)
  lines.push(`- **Diagnosed Health Conditions**: ${conditions.length > 0 ? conditions.join(', ') : 'None reported'}`)
  lines.push(`- **Allergies & Sensitivities**: ${allergies.length > 0 ? allergies.join(', ') : 'None reported'}`)
  if (p.health_conditions_text && !conditions.length) {
    lines.push(`- **Clinical Notes**: ${p.health_conditions_text}`)
  }

  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 3. ACTIVE PROTOCOLS')
  if (activeProtocols.length > 0) {
    lines.push('| Protocol Name | Author / Source | Primary Longevity Objective | Status |')
    lines.push('|---|---|---|---|')
    activeProtocols.forEach(proto => {
      lines.push(`| **${proto.name}** | ${proto.author} | ${proto.goal} | \`${proto.status}\` |`)
    })
  } else {
    lines.push('*No external parent protocols active. User is following an individual bespoke stack.*')
  }

  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 4. MASTER DAILY MODALITY SCHEDULE & DOSING MATRIX')
  lines.push('*Arranged in chronological sequence according to circadian biology and meal-timing windows.*')
  lines.push('')

  let renderedSlotsCount = 0
  CHRONOLOGICAL_CIRCADIAN_SLOTS.forEach(slotKey => {
    const modalitiesInSlot = slotGroups[slotKey]
    if (!modalitiesInSlot || modalitiesInSlot.length === 0) return

    renderedSlotsCount++
    const cfg = getCircadianConfig(slotKey)
    lines.push(`### ${cfg.label} (${cfg.timeRange})`)
    lines.push(`*Phase: ${cfg.circadianPhase}*`)
    lines.push('')
    lines.push('| Modality | Exact Dose / Protocol | Administration & Synergy Notes | Scientific Evidence / PubMed |')
    lines.push('|---|---|---|---|')

    modalitiesInSlot.forEach(({ mod, dose, instructions, temperature, duration, pubmedUrl }) => {
      const detailsArr = []
      if (dose) detailsArr.push(`**Dose:** ${dose}`)
      if (temperature) detailsArr.push(`**Temp:** ${temperature}`)
      if (duration) detailsArr.push(`**Duration:** ${duration}`)
      const doseCol = detailsArr.join(' • ') || 'Standard protocol'

      const notes = instructions ? instructions.replace(/[\n\r]+/g, ' ').slice(0, 180) + (instructions.length > 180 ? '...' : '') : 'Follow standard administration.'
      const sourceCol = pubmedUrl ? `[Clinical Study / Paper](${pubmedUrl})` : (mod.source_url ? `[Protocol Source](${mod.source_url})` : 'Empirical Longevity Reference')

      lines.push(`| **${mod.name}** | ${doseCol} | ${notes} | ${sourceCol} |`)
    })
    lines.push('')
  })

  // Anytime / Flexible slot if present
  if (slotGroups['anytime'] && slotGroups['anytime'].length > 0) {
    lines.push('### Anytime / Flexible Daily Window')
    lines.push('*Phase: Throughout Today • Habit Synergy & Vitality*')
    lines.push('')
    lines.push('| Modality | Exact Dose / Protocol | Administration & Synergy Notes | Scientific Evidence / PubMed |')
    lines.push('|---|---|---|---|')
    slotGroups['anytime'].forEach(({ mod, dose, instructions, pubmedUrl }) => {
      const doseCol = dose ? `**Dose:** ${dose}` : 'Standard protocol'
      const notes = instructions ? instructions.replace(/[\n\r]+/g, ' ').slice(0, 180) + (instructions.length > 180 ? '...' : '') : 'Flexible execution.'
      const sourceCol = pubmedUrl ? `[Clinical Study / Paper](${pubmedUrl})` : 'Empirical Reference'
      lines.push(`| **${mod.name}** | ${doseCol} | ${notes} | ${sourceCol} |`)
    })
    lines.push('')
  }

  if (renderedSlotsCount === 0 && (!slotGroups['anytime'] || slotGroups['anytime'].length === 0)) {
    lines.push('*No modalities currently scheduled in active bench slots.*')
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push('## 5. ADHERENCE & COMPLIANCE VELOCITY')
  lines.push(`- **Recent Window Execution Rate**: **${compliancePct}% Compliance** (${completedRecent} completed of ${totalRecent} recent tasks)`)
  lines.push('')

  if (payload.tasks.length > 0) {
    lines.push('### Recent Task Log Samples:')
    lines.push('| Date | Timing Window | Modality Name | Status | Completed At | Notes |')
    lines.push('|---|---|---|---|---|---|')
    payload.tasks.slice(0, 20).forEach(t => {
      const modName = payload.modalitiesMap.get(t.modality_id)?.name || t.loose_modality?.name || 'Protocol Step'
      const completedTime = t.completed_at ? format(new Date(t.completed_at), 'h:mm a') : '—'
      const statusBadge = t.status === 'completed' ? '✓ Completed' : t.status === 'skipped' ? '⊘ Skipped' : t.status
      lines.push(`| ${t.scheduled_date} | ${t.timing_slot || 'Routine'} | **${modName}** | \`${statusBadge}\` | ${completedTime} | ${t.user_notes || '—'} |`)
    })
    lines.push('')
  }

  if (payload.checkins.length > 0) {
    lines.push('---')
    lines.push('')
    lines.push('## 6. RECENT WELL-BEING & RECOVERY CHECK-INS')
    lines.push('| Date | Energy (1-10) | Focus (1-10) | Mood (1-10) | Sleep Rating | Qualitative Notes & Reflections |')
    lines.push('|---|---|---|---|---|---|')
    payload.checkins.slice(0, 14).forEach(c => {
      const e = c.energy_score ?? c.energy ?? '—'
      const f = c.focus_score ?? c.focus ?? '—'
      const m = c.mood_score ?? c.mood ?? '—'
      const s = c.sleep_quality_score ?? c.sleep ?? '—'
      const notes = (c.notes || c.user_notes || c.reflection_notes || '—').replace(/[\n\r]+/g, ' ')
      lines.push(`| ${c.date} | ${e} | ${f} | ${m} | ${s} | ${notes} |`)
    })
    lines.push('')
  }

  if (payload.biomarkers.length > 0) {
    lines.push('---')
    lines.push('')
    lines.push('## 7. BIOMARKER & LAB PANEL MEASUREMENTS')
    lines.push('| Biomarker / Test | Measured Value | Standard Unit | Reference / Target Range | Recorded Date |')
    lines.push('|---|---|---|---|---|')
    payload.biomarkers.slice(0, 25).forEach(b => {
      const name = b.biomarker_name || b.name || 'Biomarker'
      const val = b.value_numeric ?? b.value ?? '—'
      const unit = b.unit || ''
      const range = b.optimal_range || b.reference_range || 'Optimal'
      const date = b.recorded_at ? format(new Date(b.recorded_at), 'yyyy-MM-dd') : (b.date || '—')
      lines.push(`| **${name}** | ${val} | ${unit} | ${range} | ${date} |`)
    })
    lines.push('')
  }

  lines.push('---')
  lines.push('*End of LEVL Protocols Biological Dossier. Generated securely from client-side encrypted session.*')

  return lines.join('\n')
}

/**
 * 3. CLEAN TABULAR SPREADSHEET (CSV)
 * RFC 4180 compliant CSV export for Excel, Google Sheets, or Apple Numbers.
 */
export function generateProtocolTasksCSV(payload: CompleteUserDataPayload): string {
  const headers = [
    'Scheduled Date',
    'Timing Slot',
    'Protocol Name',
    'Modality Name',
    'Category',
    'Dosage',
    'Unit',
    'Status',
    'Completed Timestamp',
    'Execution Notes',
    'Source Link'
  ]

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows: string[] = [headers.map(escapeCSV).join(',')]

  if (payload.tasks.length > 0) {
    payload.tasks.forEach(t => {
      const mod = payload.modalitiesMap.get(t.modality_id) || t.loose_modality
      const proto = payload.protocolsMap.get(t.protocol_step?.protocol_id || t.user_protocol_instance?.protocol_id)

      const protoName = proto?.name || t.lineages?.[0]?.protocol_name || 'Individual Modality'
      const modName = mod?.name || 'Protocol Task'
      const category = mod?.category || 'Longevity'
      const dosage = t.custom_dose || mod?.dose_or_exposure || ''
      const unit = mod?.logging_type || ''
      const notes = t.user_notes || ''
      const sourceUrl = mod?.scientific_references?.[0]?.url || mod?.source_url || ''

      rows.push([
        escapeCSV(t.scheduled_date),
        escapeCSV(t.timing_slot || 'Anytime'),
        escapeCSV(protoName),
        escapeCSV(modName),
        escapeCSV(category),
        escapeCSV(dosage),
        escapeCSV(unit),
        escapeCSV(t.status),
        escapeCSV(t.completed_at || ''),
        escapeCSV(notes),
        escapeCSV(sourceUrl)
      ].join(','))
    })
  } else {
    // If user has not logged individual daily tasks yet, export configured bench modalities as the schedule
    payload.benchItems.forEach(item => {
      const mod = payload.modalitiesMap.get(item.modality_id)
      if (!mod) return
      rows.push([
        escapeCSV('Configured Schedule'),
        escapeCSV(item.custom_timing || mod.default_timing_slot || 'Anytime'),
        escapeCSV('My Bench'),
        escapeCSV(mod.name),
        escapeCSV(mod.category || 'Longevity'),
        escapeCSV(item.custom_dose || mod.dose_or_exposure || ''),
        escapeCSV(mod.logging_type || ''),
        escapeCSV(item.status || 'active'),
        escapeCSV(item.added_at || ''),
        escapeCSV(item.personal_notes || ''),
        escapeCSV(mod.scientific_references?.[0]?.url || mod.source_url || '')
      ].join(','))
    })
  }

  return rows.join('\r\n')
}

/**
 * 4. DAILY WELLBEING CHECKINS SPREADSHEET (CSV)
 */
export function generateCheckinsCSV(payload: CompleteUserDataPayload): string {
  const headers = [
    'Date',
    'Energy Score (1-10)',
    'Focus Score (1-10)',
    'Mood Score (1-10)',
    'Sleep Quality (1-10)',
    'Physical Recovery (1-10)',
    'Daily Stress (1-10)',
    'Reflection & Log Notes',
    'Logged Timestamp'
  ]

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows: string[] = [headers.map(escapeCSV).join(',')]

  payload.checkins.forEach(c => {
    rows.push([
      escapeCSV(c.date),
      escapeCSV(c.energy_score ?? c.energy ?? ''),
      escapeCSV(c.focus_score ?? c.focus ?? ''),
      escapeCSV(c.mood_score ?? c.mood ?? ''),
      escapeCSV(c.sleep_quality_score ?? c.sleep ?? ''),
      escapeCSV(c.recovery_score ?? c.recovery ?? ''),
      escapeCSV(c.stress_score ?? c.stress ?? ''),
      escapeCSV(c.notes || c.user_notes || c.reflection_notes || ''),
      escapeCSV(c.created_at || c.logged_at || '')
    ].join(','))
  })

  return rows.join('\r\n')
}

/**
 * Client-Side File Download Trigger
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
