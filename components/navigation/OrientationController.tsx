'use client'

import { useEffect } from 'react'

/**
 * Universal Orientation Controller for iOS & Android
 * Ensures WebAPKs, PWAs, and mobile browsers on Android & iOS
 * are free to rotate and immediately sync layout classes across the app.
 */
export default function OrientationController() {
  useEffect(() => {
    // 1. Clear any legacy WebAPK portrait locks on Android
    if (typeof screen !== 'undefined' && screen.orientation) {
      try {
        const p = (screen.orientation as any).unlock?.()
        if (p && typeof p.catch === 'function') {
          p.catch(() => {})
        }
      } catch (e) {}
    }

    const evaluateOrientation = () => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return

      // A. Standard CSS Media Query
      const isLandscapeMediaQuery = typeof window.matchMedia === 'function' && window.matchMedia('(orientation: landscape)').matches

      // B. Dynamic Viewport Aspect Ratio
      const isWideAspect = window.innerWidth > window.innerHeight

      // C. Modern Screen Orientation API (Primary standard for Android Blink/Chromium)
      const screenType = typeof screen !== 'undefined' && screen.orientation?.type ? screen.orientation.type : ''
      const screenAngle = typeof screen !== 'undefined' && typeof screen.orientation?.angle === 'number' ? screen.orientation.angle : null
      const isScreenLandscape = screenType.includes('landscape') || screenAngle === 90 || screenAngle === 270

      // D. Legacy window.orientation Fallback (Supports 90, -90, and 270 on Android & iOS)
      const legacyAngle = typeof window.orientation !== 'undefined' ? Number(window.orientation) : null
      const isLegacyLandscape = legacyAngle === 90 || legacyAngle === -90 || legacyAngle === 270

      // E. Manual in-app rotation override stored in localStorage
      const manualLandscape = localStorage.getItem('levl_manual_landscape') === 'true'

      const isLandscape = Boolean(isLandscapeMediaQuery || isWideAspect || isScreenLandscape || isLegacyLandscape || manualLandscape)

      document.documentElement.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait')
      if (isLandscape) {
        document.documentElement.classList.add('is-landscape')
      } else {
        document.documentElement.classList.remove('is-landscape')
      }

      window.dispatchEvent(new CustomEvent('levl_orientation_changed', { detail: { isLandscape } }))
    }

    // Android Blink engine delayed repaint handler:
    // Android Chrome updates innerWidth/innerHeight and orientation queries 50ms-300ms after orientationchange
    let timer1: NodeJS.Timeout
    let timer2: NodeJS.Timeout
    let timer3: NodeJS.Timeout
    let timer4: NodeJS.Timeout

    const triggerOrientationUpdate = () => {
      evaluateOrientation()
      timer1 = setTimeout(evaluateOrientation, 60)
      timer2 = setTimeout(evaluateOrientation, 150)
      timer3 = setTimeout(evaluateOrientation, 300)
      timer4 = setTimeout(evaluateOrientation, 600)
    }

    triggerOrientationUpdate()
    window.addEventListener('resize', triggerOrientationUpdate, { passive: true })
    window.addEventListener('orientationchange', triggerOrientationUpdate, { passive: true })

    if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', triggerOrientationUpdate)
    }

    const mql = typeof window.matchMedia === 'function' ? window.matchMedia('(orientation: landscape)') : null
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', triggerOrientationUpdate)
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      window.removeEventListener('resize', triggerOrientationUpdate)
      window.removeEventListener('orientationchange', triggerOrientationUpdate)
      if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.removeEventListener) {
        screen.orientation.removeEventListener('change', triggerOrientationUpdate)
      }
      if (mql && mql.removeEventListener) {
        mql.removeEventListener('change', triggerOrientationUpdate)
      }
    }
  }, [])

  return null
}
