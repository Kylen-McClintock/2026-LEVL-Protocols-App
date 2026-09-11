'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Compass, Sparkles, User, TrendingUp } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: any
  matchPaths?: string[]
}

const navItems: NavItem[] = [
  { label: 'Today', href: '/today', icon: Sun },
  { 
    label: 'Explore', 
    href: '/explore', 
    icon: Compass,
    matchPaths: ['/explore', '/protocols', '/modalities'] 
  },
  { 
    label: 'AI Coach', 
    href: '/coach', 
    icon: Sparkles,
    matchPaths: ['/coach'] 
  },
  { 
    label: 'Insights', 
    href: '/tracking', 
    icon: TrendingUp,
    matchPaths: ['/tracking', '/aging'] 
  },
  { 
    label: 'Profile', 
    href: '/settings', 
    icon: User,
    matchPaths: ['/settings', '/bench'] 
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  // Do not show bottom nav on onboarding
  if (pathname === '/onboarding') return null

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-b-0 border-l-0 border-r-0 pb-nav-ios desktop-hide-bottom-nav bg-slate-950/95 backdrop-blur-xl shadow-2xl"
      style={{
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0px))'
      }}
    >
      <div className="grid grid-cols-5 items-center h-[50px] landscape-compact-nav w-full px-1 sm:px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.matchPaths 
            ? item.matchPaths.some(p => pathname.startsWith(p))
            : pathname.startsWith(item.href)

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center h-full py-0.5 landscape-compact-nav-item space-y-0.5 transition-all ${
                isActive ? 'text-levl-accent font-bold scale-105' : 'text-levl-text-secondary hover:text-white'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="landscape-compact-icon" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
