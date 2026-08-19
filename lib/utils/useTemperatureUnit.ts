'use client'

import { useState, useEffect } from 'react'

export type TemperatureUnit = 'F' | 'C'

export const TEMP_UNIT_KEY = 'levl_temp_unit'

export function fToC(f: number): number {
  return Math.round(((f - 32) * 5) / 9)
}

export function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32)
}

/**
 * Parses and converts temperatures in free-form strings (e.g., "3 minutes @ 50°F–55°F" -> "3 minutes @ 10°C–13°C")
 */
export function formatTemperatureInText(text: string, targetUnit: TemperatureUnit): string {
  if (!text) return text

  if (targetUnit === 'C') {
    // Convert Fahrenheit range: e.g. 50°F–55°F or 50°F-55°F or 50-55°F
    let result = text.replace(/(\d+)\s*°?F\s*([–\-])\s*(\d+)\s*°F/gi, (_, f1, sep, f2) => {
      return `${fToC(Number(f1))}°C${sep}${fToC(Number(f2))}°C`
    })

    // Convert Fahrenheit with plus: e.g. 174°F+ or 175°F+
    result = result.replace(/(\d+)\s*°F\+/gi, (_, f) => {
      return `${fToC(Number(f))}°C+`
    })

    // Convert single Fahrenheit: e.g. 50°F or 65°F
    result = result.replace(/(\d+)\s*°F/gi, (_, f) => {
      return `${fToC(Number(f))}°C`
    })

    // Clean up duplicate secondary brackets if already present like "174°F+ (80°C+)" -> "80°C+"
    result = result.replace(/(\d+°C\+?)\s*\(\d+°C\+?\)/gi, '$1')
    result = result.replace(/(\d+°C[–\-]\d+°C)\s*\(\d+°C[–\-]\d+°C\)/gi, '$1')

    return result
  } else {
    // Target is 'F' (Fahrenheit)
    // Convert Celsius range: e.g. 10°C–13°C or 10°C-13°C
    let result = text.replace(/(\d+)\s*°?C\s*([–\-])\s*(\d+)\s*°C/gi, (_, c1, sep, c2) => {
      return `${cToF(Number(c1))}°F${sep}${cToF(Number(c2))}°F`
    })

    // Convert Celsius with plus: e.g. 80°C+
    result = result.replace(/(\d+)\s*°C\+/gi, (_, c) => {
      return `${cToF(Number(c))}°F+`
    })

    // Convert single Celsius: e.g. 10°C or 18°C
    result = result.replace(/(\d+)\s*°C/gi, (_, c) => {
      return `${cToF(Number(c))}°F`
    })

    // Clean up duplicate secondary brackets if already present like "50°F–55°F (50°F–55°F)" -> "50°F–55°F"
    result = result.replace(/(\d+°F\+?)\s*\(\d+°F\+?\)/gi, '$1')
    result = result.replace(/(\d+°F[–\-]\d+°F)\s*\(\d+°F[–\-]\d+°F\)/gi, '$1')

    return result
  }
}

export function getStoredTemperatureUnit(): TemperatureUnit {
  if (typeof window === 'undefined') return 'F'
  try {
    const saved = localStorage.getItem(TEMP_UNIT_KEY) as TemperatureUnit
    if (saved === 'F' || saved === 'C') {
      return saved
    }
  } catch (e) {}
  return 'F'
}

export function setStoredTemperatureUnit(unit: TemperatureUnit) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TEMP_UNIT_KEY, unit)
    window.dispatchEvent(new CustomEvent('levl_temp_unit_changed', { detail: unit }))
  } catch (e) {}
}

export function useTemperatureUnit() {
  const [unit, setUnitState] = useState<TemperatureUnit>('F')

  useEffect(() => {
    setUnitState(getStoredTemperatureUnit())

    const handleUnitChange = (e: Event) => {
      const customEvent = e as CustomEvent<TemperatureUnit>
      if (customEvent.detail === 'F' || customEvent.detail === 'C') {
        setUnitState(customEvent.detail)
      } else {
        setUnitState(getStoredTemperatureUnit())
      }
    }

    window.addEventListener('levl_temp_unit_changed', handleUnitChange)
    window.addEventListener('storage', handleUnitChange)

    return () => {
      window.removeEventListener('levl_temp_unit_changed', handleUnitChange)
      window.removeEventListener('storage', handleUnitChange)
    }
  }, [])

  const setUnit = (newUnit: TemperatureUnit) => {
    setUnitState(newUnit)
    setStoredTemperatureUnit(newUnit)
  }

  const formatText = (text: string) => formatTemperatureInText(text, unit)

  return { unit, setUnit, formatText }
}
