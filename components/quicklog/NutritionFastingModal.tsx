'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  Trash2,
  Sliders,
  Utensils,
  Plus,
  RefreshCw,
  AlertCircle,
  Apple,
  Salad,
  Info,
  ChevronRight,
  ShieldCheck,
  Zap,
  Edit3,
  Wheat,
  Image as ImageIcon
} from 'lucide-react'
import { DailyMealLogEntry, UserNutritionTargets, CircadianFastingState, MealScanResult, UserProfile } from '@/lib/types'
import {
  loadDailyMealLogs,
  saveDailyMealLog,
  deleteDailyMealLog,
  getNutritionTargets,
  saveNutritionTargets,
  calculateCircadianFastingState,
  getDailyFastingOverride,
  saveDailyFastingOverride,
  DailyFastingOverride
} from '@/lib/storage/nutritionStorage'
import { compressAndDownscaleImage } from '@/lib/utils/imageCompression'

interface NutritionFastingModalProps {
  date: string
  localUserId: string
  userProfile?: UserProfile | null
  initialShowTargets?: boolean
  onClose: () => void
  onLogsChanged?: () => void
}

type ScanStep = 'idle' | 'scanning' | 'review' | 'manual'

export default function NutritionFastingModal({
  date,
  localUserId,
  userProfile,
  initialShowTargets = false,
  onClose,
  onLogsChanged
}: NutritionFastingModalProps) {
  const [meals, setMeals] = useState<DailyMealLogEntry[]>([])
  const [targets, setTargets] = useState<UserNutritionTargets | null>(null)
  const [fastingOverride, setFastingOverride] = useState<DailyFastingOverride | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Scanning & Form State
  const [step, setStep] = useState<ScanStep>('idle')
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null)
  const [keepPhotoInJournal, setKeepPhotoInJournal] = useState(false)
  const [scanResult, setScanResult] = useState<MealScanResult | null>(null)
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Editable Form Fields
  const [mealName, setMealName] = useState('')
  const [calories, setCalories] = useState<number>(0)
  const [protein, setProtein] = useState<number>(0)
  const [carbs, setCarbs] = useState<number>(0)
  const [fiber, setFiber] = useState<number>(0)
  const [fat, setFat] = useState<number>(0)
  const [veggieServings, setVeggieServings] = useState<number>(0)
  const [fruitServings, setFruitServings] = useState<number>(0)
  const [mealTime, setMealTime] = useState<string>(format(new Date(), 'HH:mm'))
  const [ingredientsList, setIngredientsList] = useState<string[]>([])
  const [newIngredientInput, setNewIngredientInput] = useState<string>('')

  // Fasting Time Override Editor State
  const [isEditingFastingTimes, setIsEditingFastingTimes] = useState(false)
  const [overrideFirstBite, setOverrideFirstBite] = useState<string>('12:00')
  const [overrideLastBite, setOverrideLastBite] = useState<string>('20:00')

  // Targets Config Drawer
  const [showTargetsDrawer, setShowTargetsDrawer] = useState(initialShowTargets)
  const [editTargets, setEditTargets] = useState<UserNutritionTargets | null>(null)
  const [targetsSavedToast, setTargetsSavedToast] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Load Data
  const reloadData = async () => {
    if (!localUserId) return
    setIsLoading(true)
    const [fetchedMeals, fetchedTargets] = await Promise.all([
      loadDailyMealLogs(localUserId, date),
      getNutritionTargets(localUserId, userProfile)
    ])
    const ov = getDailyFastingOverride(localUserId, date)
    setMeals(fetchedMeals)
    setTargets(fetchedTargets)
    setEditTargets(fetchedTargets)
    setFastingOverride(ov)
    if (ov?.first_meal_time) setOverrideFirstBite(ov.first_meal_time)
    if (ov?.last_meal_time) setOverrideLastBite(ov.last_meal_time)
    setIsLoading(false)
  }

  useEffect(() => {
    reloadData()
  }, [date, localUserId])

  // Calculated Day Totals
  const dayTotals = useMemo(() => {
    return meals.reduce(
      (acc, m) => {
        acc.calories += m.calories || 0
        acc.protein += m.protein_g || 0
        acc.carbs += m.carbs_g || 0
        acc.fiber += m.fiber_g || 0
        acc.fat += m.fat_g || 0
        acc.veggies += m.veggie_servings || 0
        acc.fruits += m.fruit_servings || 0
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fiber: 0, fat: 0, veggies: 0, fruits: 0 }
    )
  }, [meals])

  // Circadian Fasting Calculations
  const fastingState = useMemo(() => {
    return calculateCircadianFastingState(meals, targets?.target_fasting_hours || 16, fastingOverride, date)
  }, [meals, targets, fastingOverride, date])

  // Handle Photo Selected
  const handlePhotoSelected = async (file: File) => {
    setErrorMsg(null)
    setStep('scanning')

    try {
      // 1. Client-Side Image Downscaling & Compression (max 1200px, 80% JPEG, ~150KB)
      const compressedBase64 = await compressAndDownscaleImage(file, {
        maxDimension: 1200,
        quality: 0.80
      })
      setCapturedImageBase64(compressedBase64)

      // 2. Transmit lightweight payload to AI Vision endpoint
      const formData = new FormData()
      formData.append('image', compressedBase64)

      const res = await fetch('/api/nutrition/scan', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to analyze meal image.')
      }

      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Invalid meal scan response format.')
      }

      const data: MealScanResult = json.data
      setScanResult(data)
      setPortionMultiplier(1.0)
      setMealName(data.meal_name)
      setCalories(data.calories)
      setProtein(data.protein_g)
      setCarbs(data.carbs_g)
      setFiber(data.fiber_g)
      setFat(data.fat_g)
      setVeggieServings(data.veggie_servings)
      setFruitServings(data.fruit_servings)
      setIngredientsList(data.ingredients || [])
      setNewIngredientInput('')
      setMealTime(format(new Date(), 'HH:mm'))
      setKeepPhotoInJournal(false) // Discard by default
      setStep('review')
    } catch (err: any) {
      console.error('Meal scanning error:', err)
      setErrorMsg(err.message || 'Error processing meal photo. Please try again.')
      setStep('idle')
    }
  }

  // Handle Portion Multiplier Change
  const handleMultiplierChange = (mult: number) => {
    if (!scanResult) return
    setPortionMultiplier(mult)
    setCalories(Math.round(scanResult.calories * mult))
    setProtein(Math.round(scanResult.protein_g * mult))
    setCarbs(Math.round(scanResult.carbs_g * mult))
    setFiber(Math.round(scanResult.fiber_g * mult))
    setFat(Math.round(scanResult.fat_g * mult))
    setVeggieServings(Math.round(scanResult.veggie_servings * mult * 2) / 2)
    setFruitServings(Math.round(scanResult.fruit_servings * mult * 2) / 2)
  }

  // Open Manual Entry Form
  const handleOpenManualEntry = () => {
    setScanResult(null)
    setCapturedImageBase64(null)
    setMealName('')
    setCalories(450)
    setProtein(30)
    setCarbs(35)
    setFiber(6)
    setFat(15)
    setVeggieServings(1.0)
    setFruitServings(0)
    setIngredientsList([])
    setNewIngredientInput('')
    setMealTime(format(new Date(), 'HH:mm'))
    setKeepPhotoInJournal(false)
    setStep('manual')
  }

  // Save Meal Log
  const handleSaveMeal = async () => {
    if (!mealName.trim()) {
      setErrorMsg('Please enter a meal description.')
      return
    }

    setIsSaving(true)
    setErrorMsg(null)

    try {
      const [h, m] = mealTime.split(':').map(Number)
      const mealDateObj = new Date(date + 'T12:00:00')
      mealDateObj.setHours(h || 12, m || 0, 0, 0)

      const entry: DailyMealLogEntry = {
        id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        local_user_id: localUserId,
        date,
        timestamp: mealDateObj.toISOString(),
        meal_name: mealName.trim(),
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fiber_g: Number(fiber) || 0,
        fat_g: Number(fat) || 0,
        veggie_servings: Number(veggieServings) || 0,
        fruit_servings: Number(fruitServings) || 0,
        plant_diversity_count: scanResult?.plant_diversity_count || (veggieServings > 0 || fruitServings > 0 ? 1 : 0),
        ingredients: ingredientsList.length > 0 ? ingredientsList : undefined,
        image_url: keepPhotoInJournal && capturedImageBase64 ? capturedImageBase64 : undefined,
        notes: scanResult?.summary
      }

      await saveDailyMealLog(entry)
      await reloadData()
      onLogsChanged?.()
      setStep('idle')
      setCapturedImageBase64(null)
      setScanResult(null)
      setIngredientsList([])
      setNewIngredientInput('')
    } catch (err: any) {
      console.error('Error saving meal:', err)
      setErrorMsg('Failed to save meal entry.')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Meal
  const handleDeleteMeal = async (mealId: string) => {
    await deleteDailyMealLog(localUserId, mealId)
    await reloadData()
    onLogsChanged?.()
  }

  // Save Fasting Time Overrides
  const handleSaveFastingTimesOverride = () => {
    saveDailyFastingOverride(localUserId, date, {
      first_meal_time: overrideFirstBite,
      last_meal_time: overrideLastBite
    })
    setFastingOverride({
      first_meal_time: overrideFirstBite,
      last_meal_time: overrideLastBite
    })
    setIsEditingFastingTimes(false)
    onLogsChanged?.()
  }

  // Save Custom Targets
  const handleSaveCustomTargets = async () => {
    if (!editTargets) return
    await saveNutritionTargets(localUserId, editTargets)
    setTargets(editTargets)
    setTargetsSavedToast(true)
    setTimeout(() => {
      setTargetsSavedToast(false)
      setShowTargetsDrawer(false)
    }, 1500)
    onLogsChanged?.()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] sm:max-h-[92vh] flex flex-col rounded-3xl bg-slate-950/98 border border-emerald-500/30 shadow-2xl text-white overflow-hidden my-auto">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 border border-emerald-400/40 flex items-center justify-center text-white shadow-md shrink-0">
              <Utensils size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Nutrition &amp; Fasting Engine
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI Vision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d')} • Circadian Macro &amp; Plant Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTargetsDrawer(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Configure daily macro and fasting targets"
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Targets</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. TOP PROMINENT ACTION BAR: TAKE PLATE PHOTO / UPLOAD / MANUAL */}
          {step === 'idle' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-purple-950/40 border border-emerald-500/40 shadow-xl space-y-3.5">
              {/* Hidden Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handlePhotoSelected(e.target.files[0])
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handlePhotoSelected(e.target.files[0])
                }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-black text-white">Log Plate with AI Vision</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                  Instant Macro &amp; Plant Counts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Take Photo Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all min-h-[46px]"
                >
                  <Camera size={18} />
                  <span>Take Plate Photo</span>
                </button>

                {/* Upload from Library */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[46px]"
                >
                  <Upload size={16} />
                  <span>Upload Image</span>
                </button>

                {/* Manual Add with Custom Time */}
                <button
                  type="button"
                  onClick={handleOpenManualEntry}
                  className="p-3.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 active:scale-[0.98] border border-purple-500/30 text-purple-300 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[46px]"
                >
                  <Plus size={16} />
                  <span>Manual with Time</span>
                </button>
              </div>
            </div>
          )}

          {/* SCANNING IN PROGRESS ANIMATION */}
          {step === 'scanning' && (
            <div className="py-12 text-center space-y-4 p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 animate-in fade-in">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-white">Analyzing Plate with Gemini Vision...</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Calculating portion sizes, protein density, net carbs, prebiotic fiber, and fruit/veggie servings.
                </p>
              </div>
            </div>
          )}

          {/* REVIEW OR MANUAL ENTRY FORM */}
          {(step === 'review' || step === 'manual') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Utensils size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white">
                    {step === 'review' ? 'Review & Calibrate Scanned Meal' : 'Log Meal Manually with Custom Time'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('idle')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Portion Multiplier Slider/Buttons (for Scanned Meals) */}
              {step === 'review' && scanResult && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Portion Scaling:</span>
                    <span className="font-mono font-bold text-emerald-300">{portionMultiplier}x Portion</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[0.75, 1.0, 1.25, 1.5].map((mult) => (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => handleMultiplierChange(mult)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          portionMultiplier === mult
                            ? 'bg-emerald-500 text-black shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        {mult}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meal Name & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Meal / Dish Description</label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="e.g. Scrambled Eggs with Avocado & Sourdough"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                    <Clock size={11} /> Time Consumed
                  </label>
                  <input
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="w-full bg-black/60 border border-emerald-500/40 rounded-xl p-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 5-Macro Input Grid: Separating Carbs vs Fiber */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Calories (kcal)</label>
                  <input
                    type="number"
                    value={calories || ''}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-orange-400">Protein (g)</label>
                  <input
                    type="number"
                    value={protein || ''}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-sky-400">Net Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs || ''}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-teal-400">Fiber (g)</label>
                  <input
                    type="number"
                    value={fiber || ''}
                    onChange={(e) => setFiber(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-purple-400">Fat (g)</label>
                  <input
                    type="number"
                    value={fat || ''}
                    onChange={(e) => setFat(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Plant / Veggie Servings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-emerald-400">🥦 Veggie Servings</label>
                  <input
                    type="number"
                    step="0.5"
                    value={veggieServings}
                    onChange={(e) => setVeggieServings(Number(e.target.value))}
                    className="w-full bg-black/60 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-purple-400">🫐 Fruit Servings</label>
                  <input
                    type="number"
                    step="0.5"
                    value={fruitServings}
                    onChange={(e) => setFruitServings(Number(e.target.value))}
                    className="w-full bg-black/60 border border-purple-500/30 rounded-xl p-2.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Interactive Constituent Ingredients & Foods Editor (Remove / Add) */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-black/50 border border-white/10 shadow-inner">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-slate-300 flex items-center gap-1.5">
                    <Utensils size={13} className="text-emerald-400" />
                    <span>Constituent Ingredients &amp; Foods ({ingredientsList.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Tap <span className="text-rose-400 font-bold">✕</span> to remove • Add below
                  </span>
                </div>

                {/* Interactive Ingredient Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                  {ingredientsList.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic py-1">
                      No constituent ingredients listed yet. Type below to add items.
                    </span>
                  ) : (
                    ingredientsList.map((ing, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-[11px] bg-slate-900 border border-emerald-500/30 text-emerald-200 pl-2.5 pr-1.5 py-1 rounded-xl shadow-sm hover:border-emerald-500/60 transition-all group"
                      >
                        <span className="font-medium">{ing}</span>
                        <button
                          type="button"
                          onClick={() => setIngredientsList(prev => prev.filter((_, i) => i !== idx))}
                          className="w-4 h-4 rounded-full flex items-center justify-center bg-white/5 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                          title={`Remove "${ing}"`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Inline Add Ingredient Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newIngredientInput}
                    onChange={(e) => setNewIngredientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newIngredientInput.trim()) {
                          setIngredientsList(prev => [...prev, newIngredientInput.trim()])
                          setNewIngredientInput('')
                        }
                      }
                    }}
                    placeholder="Add ingredient (e.g. 1/2 avocado, 1 scoop whey, 1 tbsp olive oil)..."
                    className="flex-1 bg-black/60 border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newIngredientInput.trim()) {
                        setIngredientsList(prev => [...prev, newIngredientInput.trim()])
                        setNewIngredientInput('')
                      }
                    }}
                    disabled={!newIngredientInput.trim()}
                    className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} strokeWidth={3} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Photo Retention Toggle: Discard by Default */}
              {capturedImageBase64 && (
                <label className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={keepPhotoInJournal}
                    onChange={(e) => setKeepPhotoInJournal(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-emerald-400" />
                      <span>Keep photo in Meal Journal</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {keepPhotoInJournal
                        ? 'Photo will be stored in your meal log.'
                        : 'Discarded by default to optimize device storage & cloud sync.'}
                    </span>
                  </div>
                </label>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('idle')}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveMeal}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[46px]"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving Meal Log...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Save Meal &amp; Update Fasting Window</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 2. CIRCADIAN FASTING & EATING WINDOW CARD (WITH EDITABLE TIMES) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-emerald-400" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Circadian Eating &amp; Fasting Window
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingFastingTimes(!isEditingFastingTimes)}
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} />
                  <span>{isEditingFastingTimes ? 'Cancel' : 'Edit Times'}</span>
                </button>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {targets?.target_fasting_hours || 16}:{24 - (targets?.target_fasting_hours || 16)} Protocol
                </span>
              </div>
            </div>

            {/* Editable Fasting Override Form */}
            {isEditingFastingTimes && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Info size={13} />
                  <span>Adjust Day&apos;s Eating Window Start &amp; Cutoff</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-300">Fast Break (First Bite)</label>
                    <input
                      type="time"
                      value={overrideFirstBite}
                      onChange={(e) => setOverrideFirstBite(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-300">Cutoff (Last Bite)</label>
                    <input
                      type="time"
                      value={overrideLastBite}
                      onChange={(e) => setOverrideLastBite(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveFastingTimesOverride}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Apply Custom Fasting Times
                </button>
              </div>
            )}

            {/* 3 Status KPI Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">First Meal (Fast Break)</span>
                <span className="text-sm font-black text-white block">
                  {fastingState.first_meal_time ? format(new Date(fastingState.first_meal_time), 'h:mm a') : '—'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {fastingState.first_meal_time ? 'Eating window opened' : 'Fasting in progress'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Meal (Cutoff)</span>
                <span className="text-sm font-black text-emerald-300 block">
                  {fastingState.last_meal_time ? format(new Date(fastingState.last_meal_time), 'h:mm a') : '—'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {fastingState.eating_window_hours > 0 ? `${fastingState.eating_window_hours}h eating span` : 'No meals logged'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Fast Duration</span>
                <span className="text-sm font-black text-sky-400 block flex items-center gap-1.5">
                  <Zap size={13} className="text-sky-400" />
                  {fastingState.first_meal_time ? `${fastingState.current_fast_hours}h Fasting` : 'Fasting Active'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Target: {targets?.target_fasting_hours || 16}h minimum
                </span>
              </div>
            </div>
          </div>

          {/* 3. DAILY 5-METRIC MACRO & PLANT PROGRESS GRID (SEPARATING CARBS VS FIBER) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={14} className="text-orange-400" />
                <span>Daily Macros &amp; Micronutrient Target Progress</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {dayTotals.calories} / {targets?.daily_calories || 2200} kcal
              </span>
            </div>

            {/* 5-Macro Precision Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Calories */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span>Calories</span>
                  <span className="text-emerald-400">{Math.round((dayTotals.calories / (targets?.daily_calories || 2200)) * 100)}%</span>
                </div>
                <div className="text-base font-black text-white">{dayTotals.calories} <span className="text-[10px] font-normal text-slate-400">kcal</span></div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((dayTotals.calories / (targets?.daily_calories || 2200)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Protein */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span>Protein</span>
                  <span className="text-orange-400">{Math.round((dayTotals.protein / (targets?.protein_g || 160)) * 100)}%</span>
                </div>
                <div className="text-base font-black text-white">{dayTotals.protein}g <span className="text-[10px] font-normal text-slate-400">/ {targets?.protein_g || 160}g</span></div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((dayTotals.protein / (targets?.protein_g || 160)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Net Carbs */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span>Net Carbs</span>
                  <span className="text-sky-400">{Math.round((dayTotals.carbs / (targets?.carbs_g || 200)) * 100)}%</span>
                </div>
                <div className="text-base font-black text-white">{dayTotals.carbs}g <span className="text-[10px] font-normal text-slate-400">/ {targets?.carbs_g || 200}g</span></div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-sky-500 to-blue-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((dayTotals.carbs / (targets?.carbs_g || 200)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Prebiotic Fiber */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-teal-400">
                  <span>Fiber</span>
                  <span className="text-teal-300">{Math.round((dayTotals.fiber / (targets?.fiber_g || 40)) * 100)}%</span>
                </div>
                <div className="text-base font-black text-white">{dayTotals.fiber}g <span className="text-[10px] font-normal text-slate-400">/ {targets?.fiber_g || 40}g</span></div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((dayTotals.fiber / (targets?.fiber_g || 40)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 col-span-2 sm:col-span-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span>Healthy Fats</span>
                  <span className="text-purple-400">{Math.round((dayTotals.fat / (targets?.fat_g || 70)) * 100)}%</span>
                </div>
                <div className="text-base font-black text-white">{dayTotals.fat}g <span className="text-[10px] font-normal text-slate-400">/ {targets?.fat_g || 70}g</span></div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((dayTotals.fat / (targets?.fat_g || 70)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Longevity Plant Phytochemical Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Veggies */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Salad size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Veggie Servings</span>
                    <span className="text-[11px] text-slate-400 block">Cruciferous &amp; Leafy Greens</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    {dayTotals.veggies} / {targets?.veggie_servings || 5.0} serv
                  </span>
                </div>
              </div>

              {/* Fruits */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900/60 border border-purple-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-400 flex items-center justify-center shrink-0">
                    <Apple size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Fruit &amp; Polyphenols</span>
                    <span className="text-[11px] text-slate-400 block">Berries &amp; Whole Fruits</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-black text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
                    {dayTotals.fruits} / {targets?.fruit_servings || 2.0} serv
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. TODAY'S MEALS TIMELINE JOURNAL */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils size={14} className="text-emerald-400" />
                <span>Today&apos;s Meal Journal ({meals.length})</span>
              </span>
            </div>

            {meals.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/30 border border-white/5 text-slate-500 space-y-2">
                <Utensils size={28} className="mx-auto text-slate-600" />
                <p className="text-xs">No meals logged for this date yet.</p>
                <p className="text-[11px] text-slate-600">Snap a photo of your plate or add a quick meal to begin your eating window.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {meal.image_url ? (
                        <img
                          src={meal.image_url}
                          alt={meal.meal_name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Utensils size={16} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white truncate block">{meal.meal_name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                            {format(new Date(meal.timestamp), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400 flex-wrap">
                          <span className="text-emerald-400 font-bold">{meal.calories} kcal</span>
                          <span>•</span>
                          <span>{meal.protein_g}g P</span>
                          <span>•</span>
                          <span>{meal.carbs_g}g C</span>
                          {meal.fiber_g > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-teal-300 font-semibold">{meal.fiber_g}g Fib</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{meal.fat_g}g F</span>
                          {meal.veggie_servings > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-300">🥦 {meal.veggie_servings} serv</span>
                            </>
                          )}
                          {meal.fruit_servings > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-purple-300">🫐 {meal.fruit_servings} serv</span>
                            </>
                          )}
                        </div>

                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {meal.ingredients.map((ing, idx) => (
                              <span key={idx} className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-300">
                                {ing}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      title="Delete meal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. CUSTOM TARGETS DRAWER */}
        {showTargetsDrawer && editTargets && (
          <div className="absolute inset-0 z-30 bg-slate-950/98 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-emerald-400" />
                  <h3 className="text-base font-black text-white">Custom Nutrition &amp; Fasting Targets</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTargetsDrawer(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>Personalized Recommendation</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Based on bodyweight ({userProfile?.weight_lbs || 175} lbs), 0.9g/lb protein supports muscle protein synthesis. Aiming for 40g+ prebiotic fiber optimizes SCFA butyrate and gut microbiome longevity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase">Daily Calorie Target (kcal)</label>
                  <input
                    type="number"
                    value={editTargets.daily_calories}
                    onChange={(e) => setEditTargets({ ...editTargets, daily_calories: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-orange-400 uppercase">Daily Protein Target (g)</label>
                  <input
                    type="number"
                    value={editTargets.protein_g}
                    onChange={(e) => setEditTargets({ ...editTargets, protein_g: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sky-400 uppercase">Daily Net Carbs Target (g)</label>
                  <input
                    type="number"
                    value={editTargets.carbs_g}
                    onChange={(e) => setEditTargets({ ...editTargets, carbs_g: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-teal-400 uppercase flex items-center gap-1">
                    <Wheat size={13} /> Daily Prebiotic Fiber Target (g)
                  </label>
                  <input
                    type="number"
                    value={editTargets.fiber_g || 40}
                    onChange={(e) => setEditTargets({ ...editTargets, fiber_g: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-teal-500/30 rounded-xl p-3 text-sm text-teal-300 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-400 uppercase">Daily Fat Target (g)</label>
                  <input
                    type="number"
                    value={editTargets.fat_g}
                    onChange={(e) => setEditTargets({ ...editTargets, fat_g: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-400 uppercase">🥦 Daily Veggie Servings Target</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editTargets.veggie_servings}
                    onChange={(e) => setEditTargets({ ...editTargets, veggie_servings: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-emerald-500/30 rounded-xl p-3 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-400 uppercase">🫐 Daily Fruit Servings Target</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editTargets.fruit_servings}
                    onChange={(e) => setEditTargets({ ...editTargets, fruit_servings: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-purple-500/30 rounded-xl p-3 text-sm text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sky-400 uppercase">Target Fasting Window (Hours)</label>
                  <select
                    value={editTargets.target_fasting_hours}
                    onChange={(e) => setEditTargets({ ...editTargets, target_fasting_hours: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={12}>12:12 Circadian Maintenance</option>
                    <option value={14}>14:10 Moderate Time-Restricted Feeding</option>
                    <option value={16}>16:8 Standard Intermittent Fasting (Recommended)</option>
                    <option value={18}>18:6 Deep Autophagy Fast</option>
                    <option value={20}>20:4 Warrior Fasting</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowTargetsDrawer(false)}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomTargets}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                {targetsSavedToast ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Targets Saved!</span>
                  </>
                ) : (
                  <span>Save Custom Targets</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
