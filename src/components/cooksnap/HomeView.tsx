'use client'

import { useAppStore, type Recipe } from '@/lib/store'
import {
  Camera,
  ChefHat,
  Sparkles,
  BookOpen,
  Refrigerator,
  Leaf,
  Drumstick,
  Bell,
  Menu,
  Clock,
  Users,
  Flame,
  Lightbulb,
  ShoppingCart,
  ArrowRight,
  Heart,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const quickActions = [
  { id: 'scan', icon: Camera, label: 'Scan Fridge', color: 'bg-orange-100 text-orange-600', action: 'scanner' as const },
  { id: 'type', icon: Sparkles, label: 'Type Ingredients', color: 'bg-amber-100 text-amber-600', action: 'confirm' as const },
  { id: 'pantry', icon: Refrigerator, label: 'My Pantry', color: 'bg-green-100 text-green-600', action: 'pantry' as const },
  { id: 'explore', icon: Compass, label: 'Explore', color: 'bg-blue-100 text-blue-600', action: 'explore' as const },
  { id: 'fav', icon: Heart, label: 'Favorites', color: 'bg-red-100 text-red-500', action: 'favorites' as const },
]

const smartTips = [
  {
    icon: '🥬',
    color: 'bg-green-100',
    title: 'Fresh greens going bad?',
    desc: 'Sauté them with garlic for a quick side dish!',
  },
  {
    icon: '💡',
    color: 'bg-amber-100',
    title: 'Pro Tip',
    desc: 'Leftover rice? Make fried rice with veggies and eggs!',
  },
]

const sampleRecipes: Recipe[] = [
  {
    id: 'sample-1',
    title: 'Paneer Butter Masala',
    cuisine: 'Indian',
    cookTime: '20 min',
    prepTime: '10 min',
    servings: 4,
    difficulty: 'Easy',
    isVegetarian: true,
    ingredients: [
      '250g paneer, cubed',
      '2 tbsp butter',
      '1 tbsp oil',
      '1 onion, finely chopped',
      '2 tomatoes, pureed',
      '1 tbsp ginger-garlic paste',
      '1 tsp red chilli powder',
      '1 tsp garam masala',
      '1/2 tsp turmeric',
      '1/2 cup cream',
      '1 tsp kasuri methi',
      'Salt to taste',
      'Fresh coriander for garnish',
    ],
    steps: [
      'Heat butter and oil in a pan. Add chopped onions and sauté until golden brown.',
      'Add ginger-garlic paste and cook for 1-2 minutes until the raw smell disappears.',
      'Add tomato puree, red chilli powder, turmeric, and salt. Cook until oil separates from the masala.',
      'Add garam masala and kasuri methi. Mix well and cook for another minute.',
      'Add paneer cubes and gently stir to coat with the masala. Simmer for 5 minutes on low heat.',
      'Pour in the cream, stir gently, and let it simmer for 2-3 minutes. Do not boil after adding cream.',
      'Garnish with fresh coriander and a swirl of cream. Serve hot with naan or jeera rice.',
    ],
    tags: ['Rich & Creamy', 'North Indian', 'Restaurant Style', 'Paneer'],
    imagePrompt: 'creamy orange paneer butter masala in a bowl with naan bread',
  },
  {
    id: 'sample-2',
    title: 'Chicken Tikka',
    cuisine: 'Indian',
    cookTime: '25 min',
    prepTime: '20 min',
    servings: 4,
    difficulty: 'Medium',
    isVegetarian: false,
    ingredients: [
      '500g boneless chicken, cubed',
      '1 cup thick yogurt',
      '2 tbsp tikka masala powder',
      '1 tbsp ginger-garlic paste',
      '1 tbsp lemon juice',
      '1 tsp red chilli powder',
      '1/2 tsp turmeric',
      '1 tbsp mustard oil',
      '1 tsp chaat masala',
      'Salt to taste',
      'Onion rings and lemon wedges for serving',
    ],
    steps: [
      'In a large bowl, mix yogurt, tikka masala, ginger-garlic paste, lemon juice, red chilli powder, turmeric, mustard oil, and salt to make the marinade.',
      'Add chicken cubes to the marinade, coat well, and refrigerate for at least 30 minutes (overnight is best).',
      'Preheat oven to 220°C (425°F). Thread chicken onto skewers, leaving small gaps between pieces.',
      'Place skewers on a baking tray lined with foil. Brush with a little oil and bake for 15-18 minutes.',
      'Turn the skewers halfway through cooking and baste with leftover marinade for extra flavor.',
      'For a charred finish, broil for 2-3 minutes at the end. Sprinkle chaat masala on top.',
      'Serve hot with onion rings, lemon wedges, and mint chutney.',
    ],
    tags: ['Tandoori', 'High Protein', 'Grilled', 'Party Starter'],
    imagePrompt: 'smoky charred chicken tikka pieces on skewers with mint chutney',
  },
  {
    id: 'sample-3',
    title: 'Pasta Primavera',
    cuisine: 'Italian',
    cookTime: '15 min',
    prepTime: '10 min',
    servings: 3,
    difficulty: 'Easy',
    isVegetarian: true,
    ingredients: [
      '250g penne pasta',
      '1 zucchini, diced',
      '1 bell pepper, diced',
      '1 cup cherry tomatoes, halved',
      '1/2 cup peas',
      '3 cloves garlic, minced',
      '2 tbsp olive oil',
      '1/2 cup parmesan cheese, grated',
      '1/4 cup fresh basil leaves',
      'Salt and black pepper to taste',
      'Red chilli flakes (optional)',
    ],
    steps: [
      'Cook pasta in salted boiling water until al dente. Reserve 1/2 cup pasta water before draining.',
      'Heat olive oil in a large pan over medium heat. Add minced garlic and sauté for 30 seconds until fragrant.',
      'Add diced zucchini and bell pepper. Sauté for 3-4 minutes until slightly tender but still crisp.',
      'Add cherry tomatoes and peas. Cook for 2 minutes, stirring gently.',
      'Toss in the cooked pasta along with reserved pasta water. Stir to combine everything well.',
      'Season with salt, black pepper, and chilli flakes if using. Add half the parmesan and toss.',
      'Plate the pasta, top with remaining parmesan and fresh basil leaves. Drizzle with olive oil and serve.',
    ],
    tags: ['Quick & Easy', 'Vegetable Packed', 'Weeknight Dinner', 'Light'],
    imagePrompt: 'colorful pasta primavera with fresh vegetables and parmesan cheese',
  },
]

export default function HomeView() {
  const {
    setCurrentView,
    setSelectedRecipe,
    pantryItems,
    favorites,
    recipeImageUrls,
  } = useAppStore()

  const [showMenu, setShowMenu] = useState(false)

  // Build the list of recipes to show on home page
  const recipesToShow: { recipe: Recipe; image: string | null }[] = favorites.length > 0
    ? favorites.slice(0, 3).map((f) => ({
        recipe: {
          id: f.id,
          title: f.title,
          cuisine: f.cuisine,
          cookTime: f.cookTime,
          prepTime: f.prepTime,
          servings: f.servings,
          difficulty: f.difficulty,
          isVegetarian: f.isVegetarian ?? true,
          ingredients: Array.isArray(f.ingredients) ? f.ingredients : [],
          steps: Array.isArray(f.steps) ? f.steps : [],
          tags: Array.isArray(f.tags) ? f.tags : [],
          imagePrompt: f.imagePrompt,
          imageUrl: f.imageUrl,
        },
        image: recipeImageUrls[f.id] || null,
      }))
    : sampleRecipes.map((r, i) => ({
        recipe: r,
        image: [`/recipe-images/paneer-butter-masala.png`, `/recipe-images/chicken-tikka.png`, `/recipe-images/pasta-primavera.png`][i] || null,
      }))

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setCurrentView('detail')
  }

  return (
    <div className="view-transition min-h-screen flex flex-col bg-gray-50/50 pb-24">
      {/* ── Top Header ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Menu className="w-4.5 h-4.5 text-gray-600" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-800 leading-tight tracking-tight">CookSnap</h1>
              <p className="text-[9px] text-gray-400 font-medium -mt-0.5">AI Kitchen Companion</p>
            </div>
          </div>

          {/* Notification */}
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center relative active:scale-95 transition-transform">
            <Bell className="w-4.5 h-4.5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-white" />
          </button>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute top-full left-3 right-3 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 slide-up">
            {[
              { label: 'Home', icon: '🏠', view: 'home' as const },
              { label: 'Scan Fridge', icon: '📸', view: 'scanner' as const },
              { label: 'Explore', icon: '🧭', view: 'explore' as const },
              { label: 'My Pantry', icon: '🧺', view: 'pantry' as const },
              { label: 'Favorites', icon: '❤️', view: 'favorites' as const },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setCurrentView(item.view)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-left transition-colors"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Hero Banner ── */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border border-orange-100/60">
        <div className="flex items-stretch">
          {/* Left: Text */}
          <div className="flex-1 px-5 py-5 flex flex-col justify-center">
            <h2 className="text-xl font-bold text-gray-800 leading-tight mb-1">
              Not sure what<br />to cook?
            </h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Snap your fridge or pantry and let AI suggest recipes just for you!
            </p>
            <Button
              onClick={() => setCurrentView('scanner')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md shadow-orange-500/25 transition-all active:scale-[0.97] w-fit"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Scan Fridge
            </Button>
          </div>

          {/* Right: Fridge Image */}
          <div className="w-[140px] relative flex-shrink-0">
            <Image
              src="/fridge-hero.png"
              alt="Open fridge"
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-4 mt-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Quick Actions</h2>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => setCurrentView(action.action)}
              className="flex flex-col items-center gap-1.5 min-w-[68px] active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center shadow-sm`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Recipe Suggestions ── */}
      <div className="mt-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-gray-800">AI Recipe Suggestions</h2>
          <button
            onClick={() => setCurrentView('explore')}
            className="text-[11px] font-semibold text-orange-500 flex items-center gap-0.5 hover:gap-1.5 transition-all"
          >
            See all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
          {recipesToShow.map(({ recipe, image }, index) => (
            <Card
              key={recipe.id}
              className="flex-shrink-0 w-[160px] overflow-hidden border-0 shadow-md hover:shadow-lg transition-all active:scale-[0.97] cursor-pointer bg-white"
              onClick={() => openRecipe(recipe)}
            >
              {/* Image area */}
              <div className="h-[110px] relative overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-100 flex items-center justify-center">
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}

                {/* Veg/Non-veg indicator */}
                <div className="absolute top-2 right-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      recipe.isVegetarian ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {recipe.isVegetarian ? (
                      <Leaf className="w-3 h-3 text-white" />
                    ) : (
                      <Drumstick className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>

                {/* Heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentView('favorites')
                  }}
                  className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                >
                  <Heart className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>

              <CardContent className="p-2.5">
                <h3 className="text-xs font-bold text-gray-800 leading-tight mb-1 line-clamp-1">{recipe.title}</h3>
                <div className="flex items-center gap-2 text-[9px] text-gray-400">
                  <div className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{recipe.prepTime}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    <span>{recipe.difficulty}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Missing Ingredients Card ── */}
      {pantryItems.length > 0 && (
        <div className="mx-4 mt-5">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 flex items-center gap-3 border border-orange-100/50">
            <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700">
                Missing ingredients?
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                Add items to your pantry to get better recipe matches
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setCurrentView('pantry')}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 shadow-sm"
            >
              Add Items
            </Button>
          </div>
        </div>
      )}

      {/* ── Smart Tips ── */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">Smart Tips</h2>
          <button className="text-[11px] font-semibold text-orange-500">See all</button>
        </div>

        <div className="flex gap-3">
          {smartTips.map((tip, index) => (
            <div
              key={index}
              className="flex-1 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-50"
            >
              <div className={`w-9 h-9 rounded-full ${tip.color} flex items-center justify-center mb-2 text-lg`}>
                {tip.icon}
              </div>
              <h3 className="text-xs font-bold text-gray-700 mb-0.5 leading-tight">{tip.title}</h3>
              <p className="text-[10px] text-gray-400 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works (bottom section) ── */}
      <div className="px-4 mt-6 mb-4">
        <h2 className="text-sm font-bold text-gray-800 mb-3">How It Works</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 space-y-3">
          {[
            { step: '1', emoji: '📸', title: 'Snap Your Fridge', desc: 'Take a photo of your fridge or pantry contents' },
            { step: '2', emoji: '🤖', title: 'AI Identifies Ingredients', desc: 'Our AI recognizes what food items you have (Hinglish supported!)' },
            { step: '3', emoji: '🍳', title: 'Get Instant Recipes', desc: 'Personalized recipes with real images based on your ingredients' },
            { step: '4', emoji: '👨‍🍳', title: 'Cook & Enjoy', desc: 'Follow step-by-step instructions and enjoy your meal' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-700">{item.title}</h3>
                <p className="text-[10px] text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
