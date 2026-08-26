'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isCompleted = localStorage.getItem('levl_onboarding_completed') === 'true'
      if (isCompleted) {
        router.replace('/today')
      } else {
        router.replace('/onboarding')
      }
    }
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="animate-pulse text-slate-400 font-bold text-sm">Loading LEVL Protocols...</div>
    </div>
  )
}
