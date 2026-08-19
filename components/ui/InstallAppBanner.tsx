'use client'

import React, { useState, useEffect } from 'react'
import { Share, PlusSquare, X, Download, Smartphone } from 'lucide-react'

export default function InstallAppBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if already in standalone / installed PWA mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true

    if (isStandalone) {
      return // Already installed, do not show banner
    }

    // Check if dismissed in localStorage in the last 7 days
    const dismissedAt = localStorage.getItem('levl_pwa_banner_dismissed')
    if (dismissedAt) {
      const daysDiff = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
      if (daysDiff < 7) return
    }

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show after 3 seconds of usage on mobile
    if (isIosDevice && window.innerWidth < 768) {
      const timer = setTimeout(() => setShowBanner(true), 3000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('levl_pwa_banner_dismissed', Date.now().toString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <aside aria-label="Install App" className="fixed top-3 left-3 right-3 z-50 md:hidden animate-in slide-in-from-top duration-300">
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-purple-500/30 backdrop-blur-xl shadow-2xl space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/icons/icon-192x192.png" 
              alt="LEVL App Icon" 
              className="w-10 h-10 rounded-xl border border-white/10 shadow-md object-contain shrink-0 bg-black/50" 
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Install LEVL App</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">PWA</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isIOS 
                  ? 'Add to Home Screen for full-screen native experience' 
                  : 'Install on your device for instant offline access'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {isIOS ? (
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <span>Tap</span>
            <Share size={13} className="text-sky-400 inline" />
            <span>Share, then</span>
            <span className="text-white font-bold inline-flex items-center gap-1">
              <PlusSquare size={13} className="text-purple-400" /> &quot;Add to Home Screen&quot;
            </span>
          </div>
        ) : deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download size={14} /> Add to Home Screen
          </button>
        ) : null}
      </div>
    </aside>
  )
}
