'use client'

import { useAppStore } from '@/lib/store'
import { Camera, ChefHat, Sparkles, BookOpen, Refrigerator, Leaf, Drumstick } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const cuisines = [
  { id: 'global', label: '🌍 Global' },
  { id: 'indian', label: '🇮🇳 Indian' },
  { id: 'italian', label: '🇮🇹 Italian' },
  { id: 'chinese', label: '🇨🇳 Chinese' },
  { id: 'mexican', label: '🇲🇽 Mexican' },
  { id: 'japanese', label: '🇯🇵 Japanese' },
  { id: 'thai', label: '🇹🇭 Thai' },
  { id: 'mediterranean', label: '🫒 Mediterranean' },
  { id: 'american', label: '🇺🇸 American' },
  { id: 'korean', label: '🇰🇷 Korean' },
  { id: 'french', label: '🇫🇷 French' },
  { id: 'middle-eastern', label: '🧆 Middle Eastern' },
]

const dietOptions = [
  { id: 'all' as const, label: '🍽️ All', desc: 'All recipes' },
  { id: 'veg' as const, label: '🟢 Veg', desc: 'Vegetarian only' },
  { id: 'nonveg' as const, label: '🔴 Non-Veg', desc: 'Non-vegetarian' },
]

export default function HomeView() {
  const { setCurrentView, selectedCuisine, setSelectedCuisine, pantryItems, favorites, dietFilter, setDietFilter } = useAppStore()

  return (
    <div className="view-transition min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 text-white px-6 pt-12 pb-10 rounded-b-3xl shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-8xl rotate-12">🍳</div>
          <div className="absolute bottom-4 left-8 text-6xl -rotate-12">🥘</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="w-8 h-8" />
            <h1 className="text-3xl font-bold tracking-tight">CookSnap</h1>
          </div>
          <p className="text-orange-100 text-base mb-6">
            Snap your fridge. Get instant recipes. Cook something amazing!
          </p>
          <Button
            onClick={() => setCurrentView('scanner')}
            className="w-full bg-white text-orange-600 hover:bg-orange-50 font-semibold text-lg py-6 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan My Fridge
          </Button>
        </div>
      </div>

      {/* Diet Preference */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-foreground">Diet Preference</h2>
        </div>
        <div className="flex gap-2">
          {dietOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDietFilter(opt.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                dietFilter === opt.id
                  ? opt.id === 'veg'
                    ? 'bg-green-500 text-white shadow-md'
                    : opt.id === 'nonveg'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine Selector */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-foreground">Cuisine Style</h2>
          <span className="text-sm text-muted-foreground">Choose your flavor</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {cuisines.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCuisine(c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCuisine === c.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3">
        <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border-orange-100"
            onClick={() => setCurrentView('scanner')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Camera className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Scan Fridge</span>
              <span className="text-xs text-muted-foreground">Snap &amp; identify</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border-orange-100"
            onClick={() => setCurrentView('confirm')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm font-medium">Type Ingredients</span>
              <span className="text-xs text-muted-foreground">English &amp; Hinglish</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border-orange-100"
            onClick={() => setCurrentView('pantry')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Refrigerator className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium">My Pantry</span>
              <span className="text-xs text-muted-foreground">{pantryItems.length} items saved</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border-orange-100"
            onClick={() => setCurrentView('favorites')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-sm font-medium">Favorites</span>
              <span className="text-xs text-muted-foreground">{favorites.length} recipes</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How it works */}
      <div className="px-4 py-4 pb-8">
        <h2 className="text-base font-semibold text-foreground mb-4">How It Works</h2>
        <div className="space-y-4">
          {[
            { step: '1', icon: '📸', title: 'Snap Your Fridge', desc: 'Take a photo of your fridge or pantry contents' },
            { step: '2', icon: '🤖', title: 'AI Identifies Ingredients', desc: 'Our AI recognizes what food items you have (supports Hinglish!)' },
            { step: '3', icon: '🍳', title: 'Get Instant Recipes', desc: 'Receive personalized recipes with real images & veg/non-veg filters' },
            { step: '4', icon: '👨‍🍳', title: 'Cook & Enjoy', desc: 'Follow step-by-step instructions and enjoy your meal' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
