'use client'

import { useAppStore, type AppView } from '@/lib/store'
import { Home, Compass, Camera, Heart, Refrigerator } from 'lucide-react'

const navItems: { id: AppView; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'explore', icon: Compass, label: 'Explore' },
  { id: 'scanner', icon: Camera, label: 'Scan' },
  { id: 'pantry', icon: Refrigerator, label: 'Pantry' },
  { id: 'favorites', icon: Heart, label: 'Saved' },
]

export default function BottomNav() {
  const { currentView, setCurrentView } = useAppStore()

  const isActive = (id: AppView) => {
    return currentView === id
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex items-end justify-around px-2 pt-1 pb-2">
        {navItems.map((item, index) => {
          const isScan = index === 2
          const active = isActive(item.id)

          if (isScan) {
            return (
              <button
                key={item.id + index}
                onClick={() => setCurrentView('scanner')}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95 transition-transform">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-orange-600 mt-0.5">{item.label}</span>
              </button>
            )
          }

          return (
            <button
              key={item.id + index}
              onClick={() => setCurrentView(item.id)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[48px] transition-colors"
            >
              <item.icon
                className={`w-5 h-5 transition-colors ${
                  active ? 'text-orange-500' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? 'text-orange-500' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
