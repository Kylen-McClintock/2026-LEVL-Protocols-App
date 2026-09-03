/**
 * Cross-Platform Tactile Haptics Engine for LEVL Protocols
 * 
 * 1. Mobile Android & Desktop Chromium: Native W3C Vibration API (navigator.vibrate)
 * 2. Native iOS & Android Apps (Capacitor / Cordova / React Native / Swift WKWebView):
 *    Directly invokes UIImpactFeedbackGenerator / UINotificationFeedbackGenerator 
 *    or Android Vibrator without requiring frontend UI modifications later.
 * 3. iOS WebKit/Safari: Graceful fallback with zero audio/layout disruption.
 */

export type HapticStyle = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'selection' 
  | 'success' 
  | 'warning' 
  | 'error'

/**
 * Triggers subtle tactile haptic vibration on mobile devices.
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (typeof window === 'undefined') return

  try {
    const win = window as any

    // 1. Check for Capacitor Native Bridge (@capacitor/haptics)
    // When the app is packaged for the iOS App Store or Google Play Store via Capacitor,
    // this instantly activates the iPhone Taptic Engine (UIImpactFeedbackGenerator)
    if (win.Capacitor?.Plugins?.Haptics) {
      const haptics = win.Capacitor.Plugins.Haptics
      switch (style) {
        case 'light':
        case 'selection':
          haptics.impact?.({ style: 'LIGHT' })
          return
        case 'medium':
          haptics.impact?.({ style: 'MEDIUM' })
          return
        case 'heavy':
          haptics.impact?.({ style: 'HEAVY' })
          return
        case 'success':
          haptics.notification?.({ type: 'SUCCESS' })
          return
        case 'warning':
          haptics.notification?.({ type: 'WARNING' })
          return
        case 'error':
          haptics.notification?.({ type: 'ERROR' })
          return
      }
    }

    // 2. Custom Swift WKWebView message handler bridge (window.webkit.messageHandlers.haptic)
    if (win.webkit?.messageHandlers?.haptic?.postMessage) {
      win.webkit.messageHandlers.haptic.postMessage({ style })
      return
    }

    // 3. Android PWA & Modern Web Browsers: Native W3C Vibration API
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (style) {
        case 'light':
        case 'selection':
          navigator.vibrate(12) // Crisp, subtle 12ms tick
          return
        case 'medium':
          navigator.vibrate(24) // Satisfying 24ms bump
          return
        case 'heavy':
          navigator.vibrate(45) // Solid 45ms impact
          return
        case 'success':
          navigator.vibrate([15, 60, 25]) // Satisfying celebratory double-pulse
          return
        case 'warning':
          navigator.vibrate([30, 50, 30])
          return
        case 'error':
          navigator.vibrate([50, 80, 50, 80, 50])
          return
      }
    }
  } catch (err) {
    // Silently ignore any hardware/permission restrictions
  }
}
