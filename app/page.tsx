'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // getLocalUserId initializes it if missing, but we want to know if they actually have a profile.
    // For MVP, we'll just check if it was newly created. Actually getLocalUserId creates it right away.
    // Let's just always route to /today. The /today page can fetch the profile, and if it's missing, bounce to /onboarding.
    router.replace('/today')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse text-levl-text-secondary">Loading...</div>
    </div>
  )
}
