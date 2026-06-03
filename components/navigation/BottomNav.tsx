'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Calendar, Bookmark, Compass, Settings } from 'lucide-react'

const navItems = [
  { label: 'Today', href: '/today', icon: Sun },
  { label: 'Weekly', href: '/weekly', icon: Calendar },
  { label: 'Bench', href: '/bench', icon: Bookmark },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  // Do not show bottom nav on onboarding
  if (pathname === '/onboarding') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-b-0 border-l-0 border-r-0 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-levl-accent' : 'text-levl-text-secondary hover:text-white'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
