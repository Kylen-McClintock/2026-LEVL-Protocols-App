'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/today')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="animate-pulse text-slate-400 font-bold text-sm">Loading LEVL Protocols...</div>
    </div>
  )
}
