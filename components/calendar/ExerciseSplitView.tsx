import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { DailyProtocolTask, UserProfile, DailyWellbeingCheckin, OutcomeDimension, Modality } from '@/lib/types'
import {
  extractWorkoutSessions,
  WorkoutSessionSummary,
  MuscleGroupVolume
} from '@/lib/exercise/exerciseSplitEngine'
import {
  BodyCompositionRecord,
  loadPhysiqueRecords,
  savePhysiqueRecordToDB,
  compressPhysiqueImage
} from '@/lib/storage/physiqueStorage'
import PhysiqueVisionScannerModal from '@/components/modals/PhysiqueVisionScannerModal'
import { getOutcomeDimensions } from '@/lib/data'
import ProtocolTaskCard from '@/components/cards/ProtocolTaskCard'
import {
  Dumbbell,
  Flame,
  Zap,
  Activity,
  Moon,
  HeartPulse,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Camera,
  Plus,
  X,
  Scale,
  Award,
  Layers,
  Clock,
  CheckCircle2,
  Info,
  ExternalLink,
  Upload,
  Eye,
  Image as ImageIcon,
  Columns
} from 'lucide-react'

interface ExerciseSplitViewProps {
  tasks: DailyProtocolTask[]
  weekDays: Date[]
  userProfile?: UserProfile | null
  wellbeingLogs?: DailyWellbeingCheckin[]
}

export default function ExerciseSplitView({
  tasks,
  weekDays,
  userProfile,
  wellbeingLogs = []
}: ExerciseSplitViewProps) {
  const router = useRouter()

  // Correlative Layer Filter Toggles
  const [showSleepOverlay, setShowSleepOverlay] = useState(true)
  const [showHrvOverlay, setShowHrvOverlay] = useState(true)
  const [showProteinOverlay, setShowProteinOverlay] = useState(true)
  const [showAntiBluntingOverlay, setShowAntiBluntingOverlay] = useState(true)

  // Interactive Workout Detail Drawer State
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSessionSummary | null>(null)

  // Body Composition Modal / State
  const [bodyRecords, setBodyRecords] = useState<BodyCompositionRecord[]>([])
  const [showBodyCompModal, setShowBodyCompModal] = useState(false)
  const [showVisionScannerModal, setShowVisionScannerModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [newMusclePct, setNewMusclePct] = useState('')
  const [newBodyFatPct, setNewBodyFatPct] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [photoPose, setPhotoPose] = useState<BodyCompositionRecord['photo_pose']>('front')
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false)
  const [allOutcomes, setAllOutcomes] = useState<OutcomeDimension[]>([])

  // Load records and outcomes from DB on mount
  useEffect(() => {
    loadPhysiqueRecords().then(records => {
      setBodyRecords(records)
    })
    getOutcomeDimensions().then(res => {
      if (res) setAllOutcomes(res)
    })
  }, [])

  // Lightbox & Side-by-Side Comparison State
  const [activePhotoModalRecord, setActivePhotoModalRecord] = useState<BodyCompositionRecord | null>(null)
  const [comparisonRecordId, setComparisonRecordId] = useState<string | null>(null)

  const {
    days,
    sessions,
    muscleVolumes,
    totalWeeklyVolumeLbs,
    totalWeeklySets,
    antiBluntingCompliancePct,
    activeFitnessModalities
  } = extractWorkoutSessions(tasks, weekDays, userProfile, wellbeingLogs)

  // Resolve matching DailyProtocolTask for the selected workout to render exact modality card
  const selectedWorkoutTask: DailyProtocolTask | null = useMemo(() => {
    if (!selectedWorkout) return null
    if (selectedWorkout.task) return selectedWorkout.task
    if (selectedWorkout.taskId) {
      const found = tasks.find(t => t.id === selectedWorkout.taskId)
      if (found) return found
    }
    const foundOnDate = tasks.find(
      t =>
        t.scheduled_date === selectedWorkout.date &&
        (t.modality_id === selectedWorkout.modalityId ||
          t.protocol_step?.modality?.name?.toLowerCase() === selectedWorkout.modalityName.toLowerCase() ||
          t.loose_modality?.name?.toLowerCase() === selectedWorkout.modalityName.toLowerCase())
    )
    if (foundOnDate) return foundOnDate

    // Synthesize a clean DailyProtocolTask object if session was profile-inferred
    return {
      id: selectedWorkout.id || `task_inferred_${selectedWorkout.date}`,
      user_id: userProfile?.id || 'local_user',
      local_user_id: userProfile?.local_user_id || 'local_user',
      protocol_step_id: selectedWorkout.modalityId || 'step_fitness',
      scheduled_date: selectedWorkout.date,
      status: selectedWorkout.isCompleted ? 'completed' : 'pending',
      created_at: new Date().toISOString(),
      loose_modality: {
        id: selectedWorkout.modalityId || 'mod_fitness',
        name: selectedWorkout.modalityName,
        category: 'exercise',
        category_name: 'Fitness & Strength',
        description: 'Structured hypertrophy, resistance, or cardiovascular training protocol.',
        evidence_level: 'High',
        time_to_benefit: 'Immediate / Acute',
        is_evidence_based: true,
        is_custom: false
      } as any,
      execution_details: {
        duration_minutes: selectedWorkout.duration_minutes || 45,
        intensity: 'Moderate-High',
        timing: 'afternoon'
      }
    }
  }, [selectedWorkout, tasks, userProfile])

  const handlePhotoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setIsCompressingPhoto(true)
    try {
      const compressed = await compressPhysiqueImage(file, 1200, 0.82)
      setUploadedPhotoUrl(compressed)
    } catch (err) {
      console.error('Error compressing physique photo:', err)
      const reader = new FileReader()
      reader.onload = e => {
        if (e.target?.result) setUploadedPhotoUrl(e.target.result as string)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsCompressingPhoto(false)
    }
  }

  const handleSaveBodyComp = async (e: React.FormEvent) => {
    e.preventDefault()
    // Allow saving if at least one field or photo or note is provided
    if (!newWeight && !newMusclePct && !newBodyFatPct && !uploadedPhotoUrl && !newNotes) return

    const record: BodyCompositionRecord = {
      id: `comp_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weight_lbs: newWeight ? parseFloat(newWeight) : undefined,
      skeletal_muscle_mass_pct: newMusclePct ? parseFloat(newMusclePct) : undefined,
      body_fat_pct: newBodyFatPct ? parseFloat(newBodyFatPct) : undefined,
      photo_url: uploadedPhotoUrl || undefined,
      photo_pose: uploadedPhotoUrl ? photoPose : undefined,
      notes: newNotes || undefined
    }

    const updated = await savePhysiqueRecordToDB(record)
    setBodyRecords(updated)
    setShowBodyCompModal(false)
    setNewWeight('')
    setNewMusclePct('')
    setNewBodyFatPct('')
    setNewNotes('')
    setUploadedPhotoUrl(null)
    setPhotoPose('front')
  }

  const latestComp = bodyRecords[0] || null

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Executive Strength & Recovery 4-KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 shadow-md">
            <Dumbbell size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Weekly Volume Tonnage
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {totalWeeklyVolumeLbs.toLocaleString()}
              </span>
              <span className="text-[10px] text-orange-400 font-bold">lbs logged</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
            <Layers size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Hypertrophy Working Sets
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {totalWeeklySets}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Sets Recorded</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Anti-Blunting mTOR Score
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                {antiBluntingCompliancePct}%
              </span>
              <span className="text-[10px] text-slate-400">&gt;4h Spacing</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-md">
            <Scale size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Skeletal Muscle Mass
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
                {latestComp?.skeletal_muscle_mass_pct !== undefined && latestComp.skeletal_muscle_mass_pct !== null
                  ? `${latestComp.skeletal_muscle_mass_pct}%`
                  : userProfile?.body_fat_percentage
                  ? `~${Math.round(100 - userProfile.body_fat_percentage)}%`
                  : 'Unset'}
              </span>
              {latestComp?.body_fat_pct !== undefined && latestComp.body_fat_pct !== null && (
                <span className="text-[10px] text-slate-400 font-mono">({latestComp.body_fat_pct}% BF)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile-Driven Training Split & Anti-Blunting Policy */}
      <div className="p-3 bg-gradient-to-r from-orange-950/40 via-slate-900 to-cyan-950/40 border border-orange-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-orange-300 font-bold">
            <Dumbbell size={14} className="text-orange-400" />
            <span>Profile Split:</span>
            <span className="px-2 py-0.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-white font-mono text-[11px]">
              {userProfile?.resistance_training_days && userProfile.resistance_training_days.length > 0
                ? userProfile.resistance_training_days.join(', ')
                : 'Mon, Wed, Fri'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
            <Clock size={13} className="text-levl-accent" />
            <span>Workout Window:</span>
            <span className="font-semibold text-white capitalize">
              {userProfile?.primary_workout_window || 'Afternoon (4:30 – 7:00 PM)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-300 text-[11px]">
            <ShieldCheck size={13} className="text-cyan-400" />
            <span>mTOR Anti-Blunting:</span>
            <span className="font-semibold text-cyan-200">Active (&gt;4h Spacing)</span>
          </div>
        </div>

        <Link
          href="/settings"
          className="text-[10px] text-slate-400 hover:text-orange-300 flex items-center gap-1 font-semibold transition-colors shrink-0"
        >
          <span>Adjust in Settings</span>
          <ChevronRight size={11} />
        </Link>
      </div>

      {/* Active Enrolled Modalities Summary */}
      {activeFitnessModalities.length > 0 && (
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Dumbbell size={13} className="text-orange-400" />
            Active Stack Modalities:
          </span>
          {activeFitnessModalities.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                const foundSession = sessions.find(s => s.modalityId === m.id || s.modalityName.toLowerCase() === m.name.toLowerCase())
                if (foundSession) {
                  setSelectedWorkout(foundSession)
                } else {
                  setSelectedWorkout({
                    id: `session_m_${m.id}`,
                    date: format(weekDays[0] || new Date(), 'yyyy-MM-dd'),
                    dayOfWeek: format(weekDays[0] || new Date(), 'EEE'),
                    modalityName: m.name,
                    modalityId: m.id,
                    splitCategory: 'strength',
                    duration_minutes: 45,
                    intensity_rpe: 8,
                    total_volume_lbs: 0,
                    total_sets: 0,
                    exercises: [],
                    isCompleted: false,
                    isScheduled: true,
                    antiBluntingStatus: 'compliant',
                    antiBluntingNote: 'Active stack fitness protocol.'
                  })
                }
              }}
              className="px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-500/50 text-orange-300 font-semibold text-[11px] transition-all cursor-pointer"
              title="Click to view modality protocol card"
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* 2. Correlative Multi-Vector Overlays Control Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-levl-accent shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Holistic Correlative Overlays:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSleepOverlay(!showSleepOverlay)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showSleepOverlay
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-slate-950/50 text-slate-500 border-slate-800'
            }`}
          >
            <Moon size={12} />
            <span>Sleep Architecture</span>
          </button>

          <button
            onClick={() => setShowHrvOverlay(!showHrvOverlay)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showHrvOverlay
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-slate-950/50 text-slate-500 border-slate-800'
            }`}
          >
            <HeartPulse size={12} />
            <span>Recovery HRV</span>
          </button>

          <button
            onClick={() => setShowProteinOverlay(!showProteinOverlay)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showProteinOverlay
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-950/50 text-slate-500 border-slate-800'
            }`}
          >
            <Flame size={12} />
            <span>Protein &amp; Nutrition</span>
          </button>

          <button
            onClick={() => setShowAntiBluntingOverlay(!showAntiBluntingOverlay)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showAntiBluntingOverlay
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-950/50 text-slate-500 border-slate-800'
            }`}
          >
            <ShieldCheck size={12} />
            <span>Anti-Blunting Check</span>
          </button>
        </div>
      </div>

      {/* 3. Weekly Split Chrono Grid (Mon - Sun) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} />
            <span>Weekly Split Architecture &amp; Past Set History</span>
          </h3>
          <span className="text-[11px] text-slate-500">Click any workout to inspect or log sets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5">
          {days.map(day => {
            const hasSessions = day.sessions.length > 0
            const hasLiftingSession = day.sessions.some(s => s.splitCategory === 'strength')

            return (
              <div
                key={day.date}
                className={`glass-card p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative ${
                  day.isToday
                    ? 'border-orange-500/80 bg-gradient-to-b from-orange-950/30 via-slate-900/95 to-slate-900/90 shadow-xl shadow-orange-950/40 ring-1 ring-orange-500/50'
                    : hasSessions
                    ? 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                    : 'border-slate-800/60 bg-slate-950/40'
                }`}
              >
                {/* Day Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black uppercase tracking-wider font-mono ${day.isToday ? 'text-orange-400 font-bold' : 'text-slate-300'}`}>
                        {day.dayOfWeek} {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.5 rounded-md bg-orange-500 text-black text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                          <span>Today</span>
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        day.sessions.some(s => s.isCompleted)
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : hasSessions
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}
                    >
                      {day.sessions.some(s => s.isCompleted)
                        ? '✓ Done'
                        : hasSessions
                        ? `${day.sessions.length} Session${day.sessions.length > 1 ? 's' : ''}`
                        : 'Rest'}
                    </span>
                  </div>

                  {/* Scheduled Workouts on This Day */}
                  {hasSessions ? (
                    <div className="space-y-2.5">
                      {day.sessions.map((s, sIdx) => {
                        const isLifting = s.splitCategory === 'strength'
                        const hasSets = s.total_sets > 0

                        return (
                          <div
                            key={s.id || sIdx}
                            onClick={() => setSelectedWorkout(s)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer group/item space-y-1.5 ${
                              s.isCompleted
                                ? 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/60'
                                : isLifting
                                ? 'bg-orange-950/20 border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-950/30'
                                : s.splitCategory === 'hiit'
                                ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-950/30'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                  isLifting
                                    ? 'bg-orange-500/20 text-orange-300'
                                    : s.splitCategory === 'hiit'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {s.splitCategory}
                              </span>
                              {s.isCompleted && (
                                <span className="text-[9px] text-emerald-400 font-bold">✓ Logged</span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-white group-hover/item:text-orange-400 transition-colors leading-snug line-clamp-2">
                              {s.modalityName}
                            </h4>

                            {hasSets ? (
                              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-0.5">
                                <span>{s.total_sets} sets</span>
                                <span className="text-white font-bold">{s.total_volume_lbs.toLocaleString()} lbs</span>
                              </div>
                            ) : (
                              <div className="text-[9px] text-slate-500 italic pt-0.5 flex justify-between items-center">
                                <span>{s.isCompleted ? 'Completed' : 'Scheduled'}</span>
                                <span className="text-levl-accent flex items-center gap-0.5 group-hover/item:underline">
                                  Details <ChevronRight size={10} />
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center space-y-1 my-2">
                      <span className="text-xs text-slate-500 font-medium block">Rest &amp; Recovery</span>
                      <span className="text-[10px] text-slate-600 block">Neuro-muscular repair</span>
                    </div>
                  )}
                </div>

                {/* Daily Correlative Layer Badges */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  {showSleepOverlay && day.sleepQualityRating !== undefined && (
                    <div className="flex items-center justify-between text-[10px] text-indigo-300">
                      <span className="flex items-center gap-1">
                        <Moon size={11} className="text-indigo-400" /> Sleep:
                      </span>
                      <span className="font-mono font-bold">{day.sleepQualityRating}/10</span>
                    </div>
                  )}

                  {showHrvOverlay && day.hrvStatus && (
                    <div className="flex items-center justify-between text-[10px] text-rose-300">
                      <span className="flex items-center gap-1">
                        <HeartPulse size={11} className="text-rose-400" /> HRV:
                      </span>
                      <span className="font-mono font-bold uppercase text-[8px] bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/30">
                        {day.hrvStatus}
                      </span>
                    </div>
                  )}

                  {showProteinOverlay && day.dailyProteinGrams !== undefined && (
                    <div className="flex items-center justify-between text-[10px] text-amber-300">
                      <span className="flex items-center gap-1">
                        <Flame size={11} className="text-amber-400" /> Protein:
                      </span>
                      <span className="font-mono font-bold">{day.dailyProteinGrams}g</span>
                    </div>
                  )}

                  {showAntiBluntingOverlay && hasLiftingSession && (
                    <div className="flex items-center justify-between text-[10px] text-cyan-300 pt-0.5">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={11} className="text-cyan-400" /> Anti-Blunt:
                      </span>
                      <span
                        className={`text-[8px] font-bold ${
                          day.dayAntiBluntingStatus === 'violation' ? 'text-rose-400 font-black' : 'text-cyan-300'
                        }`}
                      >
                        {day.dayAntiBluntingStatus === 'violation' ? '⚠️ Risk' : 'Protected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Hypertrophy Muscle Group Volume Target Distribution */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="text-orange-400" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Scientific Hypertrophy Muscle Volume Distribution (Schoenfeld et al., 2017)
            </h3>
          </div>
          <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
            Target: 10–20 Sets / Muscle / Week
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {muscleVolumes.map(mv => {
            const displaySets = mv.weeklySets
            const pct = Math.min(100, Math.round((displaySets / mv.optimalMinSets) * 100))

            return (
              <div key={mv.muscleGroup} className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{mv.displayName}</h4>
                  <span className="text-[10px] font-mono font-bold text-orange-300 bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded-md">
                    {displaySets} / {mv.optimalMinSets} sets ({pct}%)
                  </span>
                </div>

                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>Target: {mv.optimalMinSets}–{mv.optimalMaxSets} sets</span>
                  <span className={pct >= 100 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {pct >= 100 ? 'Target Reached' : `${mv.optimalMinSets - displaySets} sets to minimum`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. Body Composition & Visual Physique Timeline Hub */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Body Composition &amp; Visual Physique Timeline
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVisionScannerModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-950/40"
            >
              <Sparkles size={13} className="text-cyan-200" />
              <span>AI Vision Scan</span>
            </button>
            <button
              onClick={() => setShowBodyCompModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus size={13} />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        {bodyRecords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {bodyRecords.map(br => (
              <div key={br.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white font-mono">{br.date}</span>
                  {br.weight_lbs ? (
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                      {br.weight_lbs} lbs
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                      Photo Log
                    </span>
                  )}
                </div>

                {/* Photo Thumbnail if available */}
                {br.photo_url && (
                  <div
                    onClick={() => {
                      setActivePhotoModalRecord(br)
                      const otherRecords = bodyRecords.filter(r => r.id !== br.id && r.photo_url)
                      if (otherRecords.length > 0) {
                        setComparisonRecordId(otherRecords[0].id)
                      }
                    }}
                    className="relative rounded-xl overflow-hidden border border-indigo-500/30 h-36 bg-black group/photo cursor-pointer shadow-md"
                  >
                    <img
                      src={br.photo_url}
                      alt="Physique"
                      className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2">
                      <span className="text-[9px] font-bold text-white uppercase bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                        {br.photo_pose || 'Front'} Pose
                      </span>
                      <span className="text-[10px] text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
                        <Eye size={11} /> Expand
                      </span>
                    </div>
                  </div>
                )}

                {(br.skeletal_muscle_mass_pct !== undefined || br.body_fat_pct !== undefined) && (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {br.skeletal_muscle_mass_pct !== undefined && (
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Muscle Mass</span>
                        <span className="text-emerald-400 font-mono font-extrabold text-sm">{br.skeletal_muscle_mass_pct}%</span>
                      </div>
                    )}
                    {br.body_fat_pct !== undefined && (
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Body Fat</span>
                        <span className="text-amber-400 font-mono font-extrabold text-sm">{br.body_fat_pct}%</span>
                      </div>
                    )}
                  </div>
                )}

                {br.notes && (
                  <p className="text-[10px] text-slate-400 line-clamp-2 italic pt-0.5">
                    &ldquo;{br.notes}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/50 rounded-xl border border-slate-800/80">
            <span>No body composition logs recorded yet. Click &ldquo;Log Composition / Photo&rdquo; to track DEXA or smart scale muscle mass % and progress photos over time.</span>
          </div>
        )}
      </div>

      {/* 6. Interactive Modality Card Modal (Same as Today View) */}
      {selectedWorkout && selectedWorkoutTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
          onClick={() => setSelectedWorkout(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Dumbbell size={15} className="text-orange-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Modality Card • {selectedWorkout.dayOfWeek} {selectedWorkout.date}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkout(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Render Exact ProtocolTaskCard */}
            <ProtocolTaskCard
              task={selectedWorkoutTask}
              userProfile={userProfile}
              recentTasks={tasks}
              allOutcomes={allOutcomes}
              defaultExpanded={true}
              onStatusChange={(taskId, newStatus) => {
                const mappedStatus = (newStatus === 'eliminated' ? 'skipped' : newStatus) as DailyProtocolTask['status']
                if (selectedWorkout.task) {
                  selectedWorkout.task.status = mappedStatus
                }
                const found = tasks.find(t => t.id === taskId)
                if (found) found.status = mappedStatus
                setSelectedWorkout(null)
                router.refresh()
              }}
            />
          </div>
        </div>
      )}

      {/* 7. Log Body Composition & Photo Modal */}
      {showBodyCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveBodyComp}
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setShowBodyCompModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-extrabold uppercase tracking-wider">
                <Scale size={15} />
                <span>Log Body Composition &amp; DEXA Metrics</span>
              </div>
              <h2 className="text-lg font-black text-white">Record Physique Check-In</h2>
              <p className="text-xs text-slate-400">All fields are optional. Fill in any metric or attach a photo.</p>
            </div>

            {/* AI Scanner Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-cyan-300">
                <Sparkles size={16} className="text-cyan-400 shrink-0" />
                <span className="leading-snug">Auto-estimate body fat % &amp; posture from a photo?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBodyCompModal(false)
                  setShowVisionScannerModal(true)
                }}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-black rounded-lg cursor-pointer shrink-0 shadow-sm transition-colors"
              >
                Launch AI
              </button>
            </div>

            {/* Metrics inputs (ALL OPTIONAL) */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 178.5"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Muscle %</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 44.2"
                  value={newMusclePct}
                  onChange={e => setNewMusclePct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Body Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 12.8"
                  value={newBodyFatPct}
                  onChange={e => setNewBodyFatPct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Photo Upload Dropzone */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">
                Physique Progress Photo
              </label>

              {uploadedPhotoUrl ? (
                <div className="rounded-xl overflow-hidden border border-indigo-500/40 bg-black/60 p-2.5 flex items-center gap-3">
                  <img
                    src={uploadedPhotoUrl}
                    alt="Physique Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-xs font-bold text-white block">Photo Attached</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {(['front', 'side', 'back', 'flexed'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPhotoPose(p)}
                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${
                            photoPose === p
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedPhotoUrl(null)}
                    className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => {
                    e.preventDefault()
                    setIsDraggingPhoto(true)
                  }}
                  onDragLeave={() => setIsDraggingPhoto(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDraggingPhoto(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handlePhotoFile(e.dataTransfer.files[0])
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-black/30 cursor-pointer ${
                    isDraggingPhoto
                      ? 'border-indigo-400 bg-indigo-500/10'
                      : 'border-white/15 hover:border-indigo-500/50'
                  }`}
                >
                  <Upload size={22} className="mx-auto text-indigo-400 mb-1.5" />
                  <p className="text-xs font-bold text-white">Drag &amp; drop physique photo or browse</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handlePhotoFile(e.target.files[0])
                      }
                    }}
                    className="hidden"
                    id="physique-photo-input"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handlePhotoFile(e.target.files[0])
                      }
                    }}
                    className="hidden"
                    id="physique-camera-input"
                  />
                  <div className="flex items-center justify-center gap-2 mt-2.5">
                    <label
                      htmlFor="physique-camera-input"
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-[10px] font-black inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Camera size={12} />
                      <span>Take Live Photo</span>
                    </label>
                    <label
                      htmlFor="physique-photo-input"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Upload size={12} />
                      <span>Browse Files</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Physique Notes / Lab Details</label>
              <textarea
                placeholder="e.g. DEXA scan confirmed 1.2 lbs lean mass gain over 30 days."
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBodyCompModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
              >
                Save Composition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. Full-Screen Photo Lightbox & Side-by-Side Compare Modal */}
      {activePhotoModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 relative max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => {
                setActivePhotoModalRecord(null)
                setComparisonRecordId(null)
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-20"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-extrabold uppercase tracking-wider">
                  <Camera size={15} />
                  <span>Visual Physique Progression</span>
                </div>
                <h2 className="text-lg font-black text-white">
                  Physique Check-In ({activePhotoModalRecord.date})
                </h2>
              </div>

              {/* Side-by-Side Compare Selector */}
              {bodyRecords.filter(r => r.photo_url).length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                    <Columns size={13} className="text-indigo-400" />
                    Compare with:
                  </span>
                  <select
                    value={comparisonRecordId || ''}
                    onChange={e => setComparisonRecordId(e.target.value || null)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="">Single View</option>
                    {bodyRecords
                      .filter(r => r.id !== activePhotoModalRecord.id && r.photo_url)
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.date} ({r.weight_lbs} lbs • {r.skeletal_muscle_mass_pct}% Muscle)
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Photos Display Area */}
            {comparisonRecordId ? (
              /* Side by Side Split */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo 1 */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-white">{activePhotoModalRecord.date}</span>
                    <span className="text-indigo-300 font-mono font-bold">{activePhotoModalRecord.weight_lbs} lbs ({activePhotoModalRecord.skeletal_muscle_mass_pct}% Muscle)</span>
                  </div>
                  <div className="rounded-xl overflow-hidden bg-black h-80 flex items-center justify-center">
                    <img
                      src={activePhotoModalRecord.photo_url}
                      alt="Primary Physique"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* Photo 2 (Comparison) */}
                {(() => {
                  const compRecord = bodyRecords.find(r => r.id === comparisonRecordId)
                  if (!compRecord) return null
                  return (
                    <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-indigo-500/30">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-white">{compRecord.date}</span>
                        <span className="text-emerald-300 font-mono font-bold">{compRecord.weight_lbs} lbs ({compRecord.skeletal_muscle_mass_pct}% Muscle)</span>
                      </div>
                      <div className="rounded-xl overflow-hidden bg-black h-80 flex items-center justify-center">
                        <img
                          src={compRecord.photo_url}
                          alt="Comparison Physique"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              /* Single Large Photo */
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden bg-black max-h-[60vh] flex items-center justify-center border border-slate-800">
                  <img
                    src={activePhotoModalRecord.photo_url}
                    alt="Physique"
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">Weight: <strong className="text-white font-mono">{activePhotoModalRecord.weight_lbs} lbs</strong></span>
                    <span className="text-slate-400">Muscle Mass: <strong className="text-emerald-400 font-mono">{activePhotoModalRecord.skeletal_muscle_mass_pct}%</strong></span>
                    <span className="text-slate-400">Body Fat: <strong className="text-amber-400 font-mono">{activePhotoModalRecord.body_fat_pct}%</strong></span>
                  </div>
                  {activePhotoModalRecord.notes && (
                    <span className="text-slate-400 italic text-[11px]">&ldquo;{activePhotoModalRecord.notes}&rdquo;</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. AI Physique Vision Scanner Modal */}
      <PhysiqueVisionScannerModal
        isOpen={showVisionScannerModal}
        onClose={() => setShowVisionScannerModal(false)}
        userProfile={userProfile}
        onRecordSaved={async () => {
          const updated = await loadPhysiqueRecords()
          setBodyRecords(updated)
        }}
      />
    </div>
  )
}
