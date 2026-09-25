'use client'

import React, { useState, useEffect } from 'react'
import { Utensils, Plus } from 'lucide-react'
import ModalityIcon from '@/components/ui/ModalityIcon'
import { DailyMealLogEntry, UserProfile } from '@/lib/types'
import { loadDailyMealLogs } from '@/lib/storage/nutritionStorage'
import NutritionFastingModal from '@/components/quicklog/NutritionFastingModal'
import { BlockSizing, BlocksVisualStyle, BlocksLayoutMode, getGridClassesForSizing } from './blocksUtils'
import { useTheme } from '@/lib/utils/useTheme'
import { LEVL_TOKENS } from '@/lib/theme/designTokens'

interface BlocksNutritionTileProps {
  date: string
  localUserId: string
  userProfile?: UserProfile | null
  sizing?: BlockSizing
  visualStyle: BlocksVisualStyle
  isIgnited?: boolean
  layoutMode?: BlocksLayoutMode
  slotKey?: string
  slotTitle?: string
}

export default function BlocksNutritionTile({
  date,
  localUserId,
  userProfile,
  sizing = { width: '1/2', height: '1x' },
  visualStyle,
  isIgnited = true,
  layoutMode = 'dynamic',
  slotKey,
  slotTitle
}: BlocksNutritionTileProps) {
  const { theme } = useTheme()
  const isDaylight = theme === 'light'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [meals, setMeals] = useState<DailyMealLogEntry[]>([])

  const fetchMeals = async () => {
    if (!localUserId) return
    const logs = await loadDailyMealLogs(localUserId, date)
    setMeals(logs)
  }

  useEffect(() => {
    fetchMeals()
  }, [date, localUserId])

  // Derive slot-specific canonical meal label
  const defaultMealLabel = React.useMemo(() => {
    const key = (slotKey || '').toLowerCase()
    const title = (slotTitle || '').toLowerCase()
    if (key.includes('breakfast') || key.includes('first_meal') || title.includes('first meal')) {
      return 'First Meal'
    }
    if (key.includes('dinner') || key.includes('evening') || title.includes('last meal')) {
      return 'Last Meal'
    }
    if (key.includes('lunch') || key.includes('midday') || title.includes('lunch')) {
      return 'Lunch / Midday Meal'
    }
    return slotTitle || 'Nutrition & Meals'
  }, [slotKey, slotTitle])

  // Filter meals that match this slot
  const slotMeals = React.useMemo(() => {
    if (meals.length === 0) return []
    const key = (slotKey || '').toLowerCase()
    return meals.filter(m => {
      const name = (m.meal_name || '').toLowerCase()
      if (key.includes('breakfast') || key.includes('first_meal')) {
        return name.includes('first') || name.includes('breakfast') || name.includes('morning') || name.includes('super veggie') || name.includes('nutty pudding')
      }
      if (key.includes('dinner') || key.includes('evening')) {
        return name.includes('last') || name.includes('dinner') || name.includes('evening')
      }
      if (key.includes('lunch') || key.includes('midday')) {
        return name.includes('lunch') || name.includes('midday')
      }
      return false
    })
  }, [meals, slotKey])

  // If slot-specific meals exist, calculate their macros. If only 1 total meal logged and this is First Meal, associate it.
  const activeSlotMeals = slotMeals.length > 0 
    ? slotMeals 
    : (meals.length === 1 && (slotKey === 'breakfast' || slotKey === 'first_meal'))
    ? meals 
    : []

  const slotCalories = activeSlotMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
  const slotProtein = activeSlotMeals.reduce((sum, m) => sum + (m.protein_g || 0), 0)
  const isSlotLogged = activeSlotMeals.length > 0
  const displayTitle = isSlotLogged 
    ? (activeSlotMeals[activeSlotMeals.length - 1].meal_name || defaultMealLabel)
    : defaultMealLabel

  const { colSpanClass, heightClass } = getGridClassesForSizing(sizing, layoutMode)
  const darkBg = 'rgba(10, 14, 23, 0.95)'
  const emeraldGrad = isIgnited
    ? 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 100%)'

  // Dynamic Theme Styling
  let cardBg: string = ''
  let cardBorder: string | undefined = undefined
  let cardBoxShadow: string | undefined = undefined
  let cardClassName: string = ''
  let textColorClass: string = ''

  if (isDaylight) {
    textColorClass = 'text-[#475569]'
    cardBg = LEVL_TOKENS.light.card
    cardBorder = `1px solid ${LEVL_TOKENS.light.border}`
    cardBoxShadow = isIgnited ? '0 2px 8px rgba(16, 185, 129, 0.12)' : '0 2px 6px rgb(23 42 40 / 3%)'
    cardClassName = 'shadow-sm'
  } else {
    // Dark mode
    textColorClass = 'text-white'
    if (visualStyle === 'full-gradient') {
      cardBg = 'linear-gradient(135deg, #047857 0%, #10B981 50%, #06B6D4 100%)'
      cardBorder = '2px solid rgba(255, 255, 255, 0.4)'
      cardClassName = 'shadow-xl backdrop-blur-lg'
    } else if (visualStyle === 'light-glass') {
      cardBg = 'rgba(255, 255, 255, 0.05)'
      cardBorder = '1px solid rgba(255, 255, 255, 0.15)'
      cardBoxShadow = isIgnited ? '0 8px 32px rgba(0, 0, 0, 0.45)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
      cardClassName = 'shadow-lg backdrop-blur-xl'
    } else {
      // Default: dark-outline
      cardBg = `linear-gradient(${darkBg}, ${darkBg}) padding-box, ${emeraldGrad} border-box`
      cardBorder = '2.5px solid transparent'
      cardBoxShadow = isIgnited ? '0 4px 20px rgba(16, 185, 129, 0.25)' : undefined
      cardClassName = 'shadow-md backdrop-blur-xl'
    }
  }

  const isOneWide = layoutMode === '1-wide'
  const iconSize = isOneWide ? 22 : layoutMode === '3-wide' ? 34 : 44

  return (
    <>
      <div className={`relative select-none ${colSpanClass} ${heightClass} transition-all duration-300`}>
        <div
          onClick={() => setIsModalOpen(true)}
          className={`w-full h-full rounded-2xl sm:rounded-3xl ${
            isOneWide ? 'px-3 sm:px-4 py-2 flex flex-row items-center justify-between' : 'p-3 sm:p-4 flex flex-col items-center justify-center my-auto text-center'
          } cursor-pointer transition-all duration-500 group hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden ${textColorClass} ${cardClassName}`}
          style={{
            background: cardBg,
            border: cardBorder,
            boxShadow: cardBoxShadow
          }}
        >
          {isOneWide ? (
            /* 1-Wide Horizontal Banner Layout (Matches ModalityBlockTile Height) */
            <div className="flex-1 flex flex-row items-center justify-between gap-3 min-w-0 w-full relative z-10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isDaylight ? 'bg-[#E6F3EB] text-[#10B981]' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <ModalityIcon
                    category="nutrition"
                    modalityName={displayTitle}
                    customIcon="utensils"
                    size={22}
                    glow={isIgnited && !isDaylight}
                    isIgnited={isIgnited}
                    customColor={
                      visualStyle === 'full-gradient' && !isDaylight
                        ? '#FFFFFF'
                        : isDaylight
                        ? '#10B981'
                        : undefined
                    }
                  />
                </div>

                <div className="flex flex-col text-left min-w-0 flex-1">
                  <div className={`font-black tracking-tight leading-tight truncate text-sm sm:text-base ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>
                    {displayTitle}
                  </div>
                  {isSlotLogged && (
                    <div className={`text-[10px] sm:text-[11px] font-mono font-medium truncate ${isDaylight ? 'text-[#10B981]' : 'text-emerald-300'}`}>
                      {slotCalories} kcal • {slotProtein}g P
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isSlotLogged ? (
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isDaylight
                      ? 'bg-[#D1FAE5] text-[#10B981] border-[#10B981]/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {slotCalories} kcal
                  </span>
                ) : (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors ${
                    isDaylight
                      ? 'bg-[#EFF3F0] text-[#64748B] group-hover:bg-[#D1FAE5] group-hover:text-[#10B981]'
                      : 'bg-white/10 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-300'
                  }`}>
                    <Plus size={11} /> Log Meal
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Square Mode (2-Wide, 3-Wide) or Dynamic Centered Card Layout */
            <div className="w-full h-full flex flex-col items-center justify-center my-auto text-center px-1 relative z-10">
              {/* Top Floating Status / Macro Badge */}
              <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20">
                {isSlotLogged ? (
                  <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isDaylight
                      ? 'bg-[#D1FAE5] text-[#10B981] border-[#10B981]/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {slotCalories} kcal
                  </span>
                ) : (
                  <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-colors ${
                    isDaylight
                      ? 'bg-[#EFF3F0] text-[#64748B] group-hover:bg-[#D1FAE5] group-hover:text-[#10B981]'
                      : 'bg-white/10 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-300'
                  }`}>
                    <Plus size={10} /> Log
                  </span>
                )}
              </div>

              {/* Large Centered Utensils Icon */}
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <ModalityIcon
                  category="nutrition"
                  modalityName={displayTitle}
                  customIcon="utensils"
                  size={iconSize}
                  glow={isIgnited && !isDaylight}
                  isIgnited={isIgnited}
                  customColor={
                    visualStyle === 'full-gradient' && !isDaylight
                      ? '#FFFFFF'
                      : isDaylight
                      ? '#10B981'
                      : undefined
                  }
                />
              </div>

              {/* Centered Meal Name */}
              <div className={`font-black text-sm sm:text-base tracking-tight text-center break-words line-clamp-2 px-1 ${
                isDaylight ? 'text-[#475569]' : 'text-white'
              }`}>
                {displayTitle}
              </div>

              {isSlotLogged && (
                <div className={`text-[10px] sm:text-[11px] font-mono font-bold mt-1 text-center truncate ${
                  isDaylight ? 'text-[#10B981]' : 'text-emerald-300'
                }`}>
                  {slotProtein}g Protein
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Existing Full Nutrition / Fasting Modal */}
      {isModalOpen && (
        <NutritionFastingModal
          date={date}
          localUserId={localUserId}
          userProfile={userProfile}
          onClose={() => setIsModalOpen(false)}
          onLogsChanged={() => {
            fetchMeals()
          }}
        />
      )}
    </>
  )
}
