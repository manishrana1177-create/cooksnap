'use client'

import { useAppStore } from '@/lib/store'
import HomeView from '@/components/cooksnap/HomeView'
import ScannerView from '@/components/cooksnap/ScannerView'
import ConfirmView from '@/components/cooksnap/ConfirmView'
import ResultsView from '@/components/cooksnap/ResultsView'
import DetailView from '@/components/cooksnap/DetailView'
import PantryView from '@/components/cooksnap/PantryView'
import FavoritesView from '@/components/cooksnap/FavoritesView'

export default function Home() {
  const { currentView } = useAppStore()

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {currentView === 'home' && <HomeView />}
      {currentView === 'scanner' && <ScannerView />}
      {currentView === 'confirm' && <ConfirmView />}
      {currentView === 'results' && <ResultsView />}
      {currentView === 'detail' && <DetailView />}
      {currentView === 'pantry' && <PantryView />}
      {currentView === 'favorites' && <FavoritesView />}
    </div>
  )
}
