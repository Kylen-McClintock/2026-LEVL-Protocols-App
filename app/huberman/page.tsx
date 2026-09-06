import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import HubermanClient from './HubermanClient'

export const metadata: Metadata = {
  metadataBase: new URL('https://2026-levl-protocols-app.vercel.app'),
  title: 'Andrew Huberman: Diary of a CEO 10-Protocol Operating System | LEVL Protocols',
  description: 'The definitive daily operating system from Dr. Andrew Huberman on The Diary of a CEO. Master morning light, 90-120m caffeine delay, deliberate cold exposure, the physiological sigh, post-meal walks, and sleep rescue.',
  openGraph: {
    title: 'Andrew Huberman 10-Protocol Daily Operating System',
    description: 'Start Dr. Andrew Huberman\'s science-grounded daily routine from The Diary of a CEO with instant free access.',
    url: 'https://levl.fit/huberman',
    siteName: 'LEVL Protocols',
    images: [
      {
        url: '/og-huberman.png',
        width: 1200,
        height: 630,
        alt: 'Andrew Huberman Diary of a CEO Daily Operating System'
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andrew Huberman: Diary of a CEO 10-Protocol Operating System',
    description: 'Zero-cost, science-grounded daily protocols for morning cortisol, dopamine, focus, and deep sleep.',
    creator: '@hubermanlab'
  }
}

export default function HubermanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-300">
              Loading Andrew Huberman Protocols...
            </div>
          </div>
        </div>
      }
    >
      <HubermanClient />
    </Suspense>
  )
}
