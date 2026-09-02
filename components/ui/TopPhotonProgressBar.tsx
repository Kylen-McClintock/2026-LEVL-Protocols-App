"use client"

import React, { useEffect, useState, useRef, Suspense } from "react"
import { usePathname } from "next/navigation"

function TopPhotonProgressBarContent() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const start = () => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
    if (timerRef.current) clearInterval(timerRef.current)

    setVisible(true)
    setProgress(15)

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 65) return prev + Math.random() * 15
        if (prev < 88) return prev + Math.random() * 4
        return prev
      })
    }, 150)
  }

  const finish = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setProgress(100)
    finishTimeoutRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 350)
  }

  // Trigger on route changes
  useEffect(() => {
    start()
    const t = setTimeout(() => {
      finish()
    }, 250)
    return () => clearTimeout(t)
  }, [pathname])

  // Global event listeners for background data syncing
  useEffect(() => {
    const handleSyncStart = () => start()
    const handleSyncEnd = () => finish()

    window.addEventListener("levl_sync_start", handleSyncStart)
    window.addEventListener("levl_sync_end", handleSyncEnd)

    return () => {
      window.removeEventListener("levl_sync_start", handleSyncStart)
      window.removeEventListener("levl_sync_end", handleSyncEnd)
      if (timerRef.current) clearInterval(timerRef.current)
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
    }
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] relative transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      >
        {/* Leading edge photon spark */}
        {progress > 0 && progress < 100 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-200 shadow-[0_0_8px_#fff,0_0_16px_#22d3ee] -mr-1.5 opacity-90 animate-pulse" />
        )}
      </div>
    </div>
  )
}

export const TopPhotonProgressBar: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <TopPhotonProgressBarContent />
    </Suspense>
  )
}
