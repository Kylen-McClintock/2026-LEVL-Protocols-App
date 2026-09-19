'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  isWeatherTrackingEnabled,
  setWeatherTrackingEnabled,
  syncWeatherTrackingFromProfile,
  getCachedWeather,
  LocalWeatherData
} from '@/lib/services/weatherService'
import { UserProfile } from '@/lib/types'

export function useWeatherTracking(profile?: UserProfile | null, localUserId?: string) {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return isWeatherTrackingEnabled()
  })
  const [currentWeather, setCurrentWeather] = useState<LocalWeatherData | null>(() => {
    return getCachedWeather()
  })
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  // Sync with profile if available
  useEffect(() => {
    if (profile) {
      syncWeatherTrackingFromProfile(profile)
      setIsEnabled(isWeatherTrackingEnabled())
    }
  }, [profile])

  // Listen for local and cross-tab/window changes
  useEffect(() => {
    const handleTrackingChanged = (e: any) => {
      if (e.detail && typeof e.detail.enabled === 'boolean') {
        setIsEnabled(e.detail.enabled)
        if (!e.detail.enabled) {
          setCurrentWeather(null)
        }
      }
    }

    const handleWeatherUpdated = (e: any) => {
      setCurrentWeather(e.detail || null)
    }

    window.addEventListener('levl_weather_tracking_changed', handleTrackingChanged)
    window.addEventListener('levl_weather_updated', handleWeatherUpdated)

    return () => {
      window.removeEventListener('levl_weather_tracking_changed', handleTrackingChanged)
      window.removeEventListener('levl_weather_updated', handleWeatherUpdated)
    }
  }, [])

  const setTracking = useCallback(async (enabled: boolean) => {
    setIsUpdating(true)
    try {
      await setWeatherTrackingEnabled(enabled, localUserId || profile?.local_user_id)
      setIsEnabled(enabled)
    } finally {
      setIsUpdating(false)
    }
  }, [localUserId, profile?.local_user_id])

  const toggleTracking = useCallback(async () => {
    await setTracking(!isEnabled)
  }, [isEnabled, setTracking])

  return {
    isEnabled,
    currentWeather,
    isUpdating,
    setTracking,
    toggleTracking
  }
}
