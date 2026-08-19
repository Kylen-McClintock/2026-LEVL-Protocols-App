'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Calendar, Compass, User, TrendingUp } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: any
  matchPaths?: string[]
}

const navItems: NavItem[] = [
  { label: 'Today', href: '/today', icon: Sun },
  { label: 'Schedule', href: '/schedule', icon: Calendar },
  { label: 'Explore', href: '/explore', icon: Compass },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-b-0 border-l-0 border-r-0 pb-safe md:hidden bg-slate-950/95 backdrop-blur-xl shadow-2xl">
      <div className="grid grid-cols-5 items-center h-16 w-full px-1 sm:px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.matchPaths 
            ? item.matchPaths.some(p => pathname.startsWith(p))
            : pathname.startsWith(item.href)

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center h-full py-1 space-y-1 transition-all ${
                isActive ? 'text-levl-accent font-bold scale-105' : 'text-levl-text-secondary hover:text-white'
              }`}
            >
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
