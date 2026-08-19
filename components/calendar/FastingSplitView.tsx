'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DailyProtocolTask, UserProfile, Modality, DailyMealLogEntry, UserNutritionTargets } from '@/lib/types'
import { format } from 'date-fns'
import {
  Clock,
  Sparkles,
  Flame,
  Zap,
  Activity,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Info,
  Plus,
  ExternalLink,
  Utensils,
  Salad,
  Apple,
  Sliders,
  Camera,
  Edit3,
  Wheat
} from 'lucide-react'
import { loadAllMealLogs, getNutritionTargets } from '@/lib/storage/nutritionStorage'
import NutritionFastingModal from '@/components/quicklog/NutritionFastingModal'

interface FastingSplitViewProps {
  tasks: DailyProtocolTask[]
  weekDays: Date[]
  userProfile?: UserProfile | null
  localUserId?: string
}

export function isFastingModality(task: DailyProtocolTask): boolean {
  const m = task.loose_modality || task.protocol_step?.modality
  const mId = (task.modality_id || m?.id || '').toLowerCase()
  const cat = (m?.category || '').toLowerCase()
  const name = (m?.name || '').toLowerCase()

  return (
    cat.includes('fasting') ||
    cat.includes('autophagy') ||
    mId.includes('fast') ||
    name.includes('fast')
  )
}

export default function FastingSplitView({
  tasks,
  weekDays,
  userProfile,
  localUserId: propsLocalUserId
}: FastingSplitViewProps) {
  const router = useRouter()
  const localUserId = propsLocalUserId || userProfile?.local_user_id || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') || 'default_user' : 'default_user')

  const [allMeals, setAllMeals] = useState<DailyMealLogEntry[]>([])
  const [targets, setTargets] = useState<UserNutritionTargets | null>(null)
  const [selectedDayForModal, setSelectedDayForModal] = useState<string | null>(null)
  const [modalInitialShowTargets, setModalInitialShowTargets] = useState<boolean>(false)

  // Load Meals & Nutrition Targets
  const reloadData = async () => {
    if (!localUserId) return
    const [fetchedMeals, fetchedTargets] = await Promise.all([
      loadAllMealLogs(localUserId),
      getNutritionTargets(localUserId, userProfile)
    ])
    setAllMeals(fetchedMeals)
    setTargets(fetchedTargets)
  }

  useEffect(() => {
    reloadData()

    const handleUpdate = () => reloadData()
    window.addEventListener('levl_nutrition_updated', handleUpdate)
    window.addEventListener('levl_nutrition_targets_updated', handleUpdate)
    window.addEventListener('levl_quicklog_updated', handleUpdate)

    return () => {
      window.removeEventListener('levl_nutrition_updated', handleUpdate)
      window.removeEventListener('levl_nutrition_targets_updated', handleUpdate)
      window.removeEventListener('levl_quicklog_updated', handleUpdate)
    }
  }, [localUserId])

  // Active fasting tasks & modalities
  const fastingTasks = tasks.filter(isFastingModality)
  const activeFastingModalitiesMap = new Map<string, Modality>()
  fastingTasks.forEach(t => {
    const m = t.loose_modality || t.protocol_step?.modality
    if (m) activeFastingModalitiesMap.set(m.id, m)
  })
  const activeFastingModalities = Array.from(activeFastingModalitiesMap.values())

  const hasFastingActive = activeFastingModalities.length > 0 || !!userProfile?.fasting_schedule || allMeals.length > 0

  const fastProtocol = userProfile?.fasting_schedule || (activeFastingModalities[0]?.id?.includes('omad') ? 'omad' : activeFastingModalities[0]?.id?.includes('20_4') ? '20_4' : '16_8')
  const defaultFirstBite = userProfile?.eating_window_start || targets?.eating_window_start_target || '12:00'
  const defaultLastBite = userProfile?.eating_window_end || targets?.eating_window_end_target || '20:00'

  const fastingWindowHours = targets?.target_fasting_hours || (fastProtocol === 'omad' ? 23 : fastProtocol === '20_4' ? 20 : fastProtocol === '18_6' ? 18 : 16)
  const feedingWindowHours = 24 - fastingWindowHours

  // Weekly Nutrition Stats
  const weekDayStrs = useMemo(() => weekDays.map(d => format(d, 'yyyy-MM-dd')), [weekDays])
  
  const weekMeals = useMemo(() => {
    return allMeals.filter(m => weekDayStrs.includes(m.date))
  }, [allMeals, weekDayStrs])

  const weeklySummary = useMemo(() => {
    const daysWithMeals = new Set(weekMeals.map(m => m.date)).size || 1
    const totalCals = weekMeals.reduce((acc, m) => acc + (m.calories || 0), 0)
    const totalProt = weekMeals.reduce((acc, m) => acc + (m.protein_g || 0), 0)
    const totalCarbs = weekMeals.reduce((acc, m) => acc + (m.carbs_g || 0), 0)
    const totalFiber = weekMeals.reduce((acc, m) => acc + (m.fiber_g || 0), 0)
    const totalVeggies = weekMeals.reduce((acc, m) => acc + (m.veggie_servings || 0), 0)
    const totalFruits = weekMeals.reduce((acc, m) => acc + (m.fruit_servings || 0), 0)

    // Distinct plant species across the week (excluding animal proteins and non-plant fillers)
    const plantSet = new Set<string>()
    const NON_PLANT_KEYWORDS = [
      'egg', 'chicken', 'steak', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'bacon',
      'whey', 'casein', 'cheese', 'yogurt', 'milk', 'butter', 'ghee', 'cream', 'gelatin', 'collagen',
      'protein bar', 'shake', 'powder', 'water', 'salt', 'oil fraction', 'isolate'
    ]

    weekMeals.forEach(m => {
      (m.ingredients || []).forEach(ing => {
        const raw = ing.toLowerCase().trim()
        const isNonPlant = NON_PLANT_KEYWORDS.some(k => raw.includes(k))
        if (!isNonPlant && raw.length > 2) {
          plantSet.add(raw)
        }
      })
    })

    const distinctPlants = plantSet.size > 0
      ? Math.min(30, plantSet.size)
      : weekMeals.reduce((acc, m) => {
          if ((m.veggie_servings || 0) > 0 || (m.fruit_servings || 0) > 0) {
            return acc + (m.plant_diversity_count || 1)
          }
          return acc
        }, 0)

    return {
      avgCalories: Math.round(totalCals / daysWithMeals),
      avgProtein: Math.round(totalProt / daysWithMeals),
      avgCarbs: Math.round(totalCarbs / daysWithMeals),
      avgFiber: Math.round(totalFiber / daysWithMeals),
      avgVeggies: Math.round((totalVeggies / daysWithMeals) * 10) / 10,
      avgFruits: Math.round((totalFruits / daysWithMeals) * 10) / 10,
      distinctPlantsCount: Math.min(30, distinctPlants),
      totalMealsLogged: weekMeals.length
    }
  }, [weekMeals])

  // Open targets editor directly from headline buttons
  const handleOpenTargetsEditor = () => {
    setSelectedDayForModal(format(new Date(), 'yyyy-MM-dd'))
    setModalInitialShowTargets(true)
  }

  // Open meal logger for a specific date
  const handleOpenDayModal = (dateStr: string) => {
    setSelectedDayForModal(dateStr)
    setModalInitialShowTargets(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. NUTRITION & FASTING EXECUTIVE 4-KPI GRID (CLICKABLE TO EDIT TARGETS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Fasting Ratio Card */}
        <button
          type="button"
          onClick={handleOpenTargetsEditor}
          className="text-left p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md transition-all group cursor-pointer"
          title="Click to edit fasting window and eating span targets"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-md">
              <Clock size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Fasting Window
                </span>
                <Edit3 size={11} className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {fastingWindowHours}:{feedingWindowHours}
                </span>
                <span className="text-[10px] text-teal-400 font-bold">Ratio</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                {defaultFirstBite} – {defaultLastBite}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            Edit
          </span>
        </button>

        {/* Daily Caloric & Protein Average Card */}
        <button
          type="button"
          onClick={handleOpenTargetsEditor}
          className="text-left p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md transition-all group cursor-pointer"
          title="Click to edit daily calorie, protein, net carb & fiber targets"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-md">
              <Flame size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Weekly Avg Intake
                </span>
                <Edit3 size={11} className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-orange-300 font-mono">
                  {weeklySummary.avgCalories || targets?.daily_calories || 2200}
                </span>
                <span className="text-[10px] text-slate-400">kcal/d</span>
              </div>
              <span className="text-[10px] text-orange-400 font-bold block truncate mt-0.5">
                Avg Protein: {weeklySummary.avgProtein || targets?.protein_g || 160}g
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            Edit
          </span>
        </button>

        {/* Longevity Plant Servings Card */}
        <button
          type="button"
          onClick={handleOpenTargetsEditor}
          className="text-left p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md transition-all group cursor-pointer"
          title="Click to edit daily vegetable & fruit serving goals"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-md">
              <Salad size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Daily Plant Servings
                </span>
                <Edit3 size={11} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                  {weeklySummary.avgVeggies} 🥦
                </span>
                <span className="text-sm font-black text-purple-300 font-mono">
                  {weeklySummary.avgFruits} 🫐
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                Goal: {targets?.veggie_servings || 5} veg • {targets?.fruit_servings || 2} fruit
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            Edit
          </span>
        </button>

        {/* Weekly Plant Diversity Target Card */}
        <button
          type="button"
          onClick={handleOpenTargetsEditor}
          className="text-left p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md transition-all group cursor-pointer"
          title="Click to view and adjust longevity prebiotic and botanical targets"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-md">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Plant Diversity Count
                </span>
                <Edit3 size={11} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
                  {weeklySummary.distinctPlantsCount}
                </span>
                <span className="text-[10px] text-slate-400">/ 30 species</span>
              </div>
              <span className="text-[10px] text-purple-400 font-bold block truncate mt-0.5">
                Microbiome Longevity Target
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            Edit
          </span>
        </button>
      </div>

      {/* Active Enrolled Fasting Modalities */}
      {activeFastingModalities.length > 0 && (
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Flame size={13} className="text-teal-400" />
            Active Fasting Protocols:
          </span>
          {activeFastingModalities.map(m => (
            <span
              key={m.id}
              className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold"
            >
              {m.name}
            </span>
          ))}
        </div>
      )}

      {/* 2. WEEKLY UNIFIED NUTRITION & FASTING TIMELINE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils size={14} className="text-emerald-400" />
            <span>Weekly Circadian Nutrition &amp; Fasting Timeline</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {weekMeals.length} meals logged this week
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5">
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayName = format(day, 'EEE')
            const dayNum = dateStr.split('-')[2]
            
            const dayFastingTask = fastingTasks.find(t => t.scheduled_date === dateStr)
            const isFastingCompleted = dayFastingTask?.status === 'completed'

            // Meals logged for this specific day
            const dayMeals = allMeals.filter(m => m.date === dateStr)
            const dayCalories = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0)
            const dayProtein = dayMeals.reduce((acc, m) => acc + (m.protein_g || 0), 0)
            const dayCarbs = dayMeals.reduce((acc, m) => acc + (m.carbs_g || 0), 0)
            const dayFiber = dayMeals.reduce((acc, m) => acc + (m.fiber_g || 0), 0)
            const dayVeggies = dayMeals.reduce((acc, m) => acc + (m.veggie_servings || 0), 0)
            const dayFruits = dayMeals.reduce((acc, m) => acc + (m.fruit_servings || 0), 0)

            // Dynamic eating window from actual meals
            let actualFirstBite = defaultFirstBite
            let actualLastBite = defaultLastBite
            if (dayMeals.length > 0) {
              const sorted = [...dayMeals].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              actualFirstBite = format(new Date(sorted[0].timestamp), 'h:mm a')
              actualLastBite = format(new Date(sorted[sorted.length - 1].timestamp), 'h:mm a')
            }

            return (
              <div
                key={dateStr}
                className={`glass-card p-4 rounded-2xl border transition-all space-y-3.5 flex flex-col justify-between ${
                  dayMeals.length > 0 || isFastingCompleted
                    ? 'border-emerald-500/40 bg-slate-900/90 shadow-lg shadow-emerald-950/20'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
                      {dayName} {dayNum}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        dayMeals.length > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                      }`}
                    >
                      {dayMeals.length > 0 ? `${dayCalories} kcal` : `${fastingWindowHours}h Fast`}
                    </span>
                  </div>

                  {/* Fasting Arc Bar */}
                  <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Eating Window</span>
                      <span className="text-emerald-300 font-mono font-bold">
                        {dayMeals.length > 0 ? `${actualFirstBite} – ${actualLastBite}` : `${defaultFirstBite} – ${defaultLastBite}`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                        style={{ width: `${(feedingWindowHours / 24) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily Macro Progress Summary: Separating Carbs vs Fiber */}
                  {dayMeals.length > 0 ? (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-300 font-mono">
                        <span className="font-bold text-orange-400">{dayProtein}g Prot</span>
                        <span className="text-slate-400 font-bold">{dayCalories}k</span>
                      </div>

                      {/* Separated Net Carbs & Fiber Row */}
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-sky-300">{dayCarbs}g Net C</span>
                        <span className="text-teal-300 font-semibold">{dayFiber}g Fiber</span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        {dayVeggies > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                            🥦 {dayVeggies} serv
                          </span>
                        )}
                        {dayFruits > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                            🫐 {dayFruits} serv
                          </span>
                        )}
                      </div>

                      {/* Logged Meals List */}
                      <div className="pt-1.5 space-y-1">
                        {dayMeals.slice(0, 2).map(m => (
                          <div key={m.id} className="text-[10px] text-slate-400 truncate flex items-center justify-between bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                            <span className="truncate max-w-[110px]">{m.meal_name}</span>
                            <span className="font-mono text-emerald-400 font-bold shrink-0">{m.calories}k</span>
                          </div>
                        ))}
                        {dayMeals.length > 2 && (
                          <span className="text-[9px] text-slate-500 block text-right font-mono">
                            +{dayMeals.length - 2} more meal{dayMeals.length - 2 !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-slate-500 text-[11px]">
                      <span>No meals logged</span>
                    </div>
                  )}
                </div>

                {/* Day Action Button */}
                <button
                  type="button"
                  onClick={() => handleOpenDayModal(dateStr)}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>{dayMeals.length > 0 ? 'View / Log Meals' : 'Log Meal'}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. BIOLOGICAL FASTING & AUTOPHAGY SCIENCE CARD */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-teal-400">
          <Info size={18} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Biological Stages of Fasting &amp; Autophagy Activation
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
              0 – 12 Hours
            </span>
            <h4 className="text-xs font-bold text-white">Glycogen Depletion</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Blood glucose and circulating insulin drop. The liver mobilizes stored glycogen for ATP production.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 rounded-md">
              12 – 18 Hours
            </span>
            <h4 className="text-xs font-bold text-white">Ketogenesis &amp; Fat Oxidation</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Lipolysis surges. The liver converts fatty acids into beta-hydroxybutyrate (BHB), fueling the brain and sparing muscle tissue.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
              18 – 24+ Hours
            </span>
            <h4 className="text-xs font-bold text-white">Deep Autophagy &amp; Cellular Cleanup</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              AMPK activation suppresses mTOR, stimulating autophagosomes to clear damaged senescent organelles and misfolded proteins.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: AI Nutrition & Circadian Fasting Engine */}
      {selectedDayForModal && (
        <NutritionFastingModal
          date={selectedDayForModal}
          localUserId={localUserId}
          userProfile={userProfile}
          initialShowTargets={modalInitialShowTargets}
          onClose={() => {
            setSelectedDayForModal(null)
            setModalInitialShowTargets(false)
          }}
          onLogsChanged={reloadData}
        />
      )}
    </div>
  )
}
