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

      // Mobile landscape: true phone held horizontally (short height <= 550px AND wide aspect)
      const isMobileLandscape = window.innerWidth > window.innerHeight && window.innerHeight <= 550

      // Screen orientation angle (90 or 270) on mobile devices (max dimension <= 1024)
      const screenAngle = typeof screen !== 'undefined' && typeof screen.orientation?.angle === 'number' ? screen.orientation.angle : null
      const isMobileScreenRotated = (screenAngle === 90 || screenAngle === 270) && Math.max(window.innerWidth, window.innerHeight) <= 1024

      // Legacy window.orientation Fallback on mobile
      const legacyAngle = typeof window.orientation !== 'undefined' ? Number(window.orientation) : null
      const isMobileLegacyRotated = (legacyAngle === 90 || legacyAngle === -90 || legacyAngle === 270) && Math.max(window.innerWidth, window.innerHeight) <= 1024

      const isLandscape = Boolean(isMobileLandscape || isMobileScreenRotated || isMobileLegacyRotated)

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
