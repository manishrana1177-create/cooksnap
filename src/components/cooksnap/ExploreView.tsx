'use client'

import { useAppStore, type Recipe } from '@/lib/store'
import { Clock, Users, Flame, Leaf, Drumstick, Compass, Sparkles, ChefHat, RefreshCw, Search, ShoppingCart, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

const CUISINES = [
  { id: 'all', label: '🍽️ All', emoji: '🍽️' },
  { id: 'North Indian', label: '🫓 North Indian', emoji: '🫓' },
  { id: 'South Indian', label: '🥘 South Indian', emoji: '🥘' },
  { id: 'East Indian', label: '🍲 East Indian', emoji: '🍲' },
  { id: 'West Indian', label: '🥗 West Indian', emoji: '🥗' },
  { id: 'Indo-Chinese', label: '🥡 Indo-Chinese', emoji: '🥡' },
  { id: 'Street Food', label: '🌮 Street Food', emoji: '🌮' },
  { id: 'Fast Food & Cafe', label: '🍔 Fast Food', emoji: '🍔' },
  { id: 'Healthy & Fitness', label: '💪 Healthy', emoji: '💪' },
  { id: 'Vegetarian', label: '🌿 Veg', emoji: '🌿' },
  { id: 'Non-Vegetarian', label: '🍗 Non-Veg', emoji: '🍗' },
]

export default function ExploreView() {
  const {
    setCurrentView,
    setSelectedRecipe,
    pantryItems,
    setPantryItems,
    recipeImageUrls,
    setRecipeImageUrl,
  } = useAppStore()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [matchInfo, setMatchInfo] = useState<{ source: string; matchedCount: number } | null>(null)
  const [cuisineCounts, setCuisineCounts] = useState<Record<string, number>>({})
  const hasLoaded = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  // Load pantry items on mount
  useEffect(() => {
    const loadPantry = async () => {
      try {
        const res = await fetch('/api/pantry')
        if (res.ok) {
          const data = await res.json()
          setPantryItems(data.items || [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadPantry()
  }, [setPantryItems])

  // Fetch cuisine counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/seed/recipes')
        if (res.ok) {
          const data = await res.json()
          const counts: Record<string, number> = {}
          if (data.byCuisine) {
            data.byCuisine.forEach((c: { cuisine: string; count: number }) => {
              counts[c.cuisine] = c.count
            })
          }
          setCuisineCounts(counts)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchCounts()
  }, [recipes])

  // Search recipes from database whenever pantry or cuisine changes
  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true
    searchRecipes()
  }, [pantryItems])

  // Re-search when cuisine changes
  useEffect(() => {
    if (hasLoaded.current) {
      searchRecipes()
    }
  }, [selectedCuisine])

  const searchRecipes = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    try {
      const ingredientNames = pantryItems.map((p) => p.name)
      const cuisineFilter = selectedCuisine !== 'all' ? selectedCuisine : undefined

      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/recipes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredientNames,
          cuisine: cuisineFilter,
          limit: 30,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      if (data.recipes && data.recipes.length > 0) {
        setRecipes(data.recipes)
        setMatchInfo({ source: data.source, matchedCount: data.total || 0 })
      } else {
        setRecipes([])
        setMatchInfo(null)
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return // cancelled, ignore
      console.error(error)
      setRecipes([])
    } finally {
      setIsLoading(false)
    }
  }, [pantryItems, selectedCuisine])

  // Refresh - re-search with current pantry & cuisine
  const handleRefresh = () => {
    searchRecipes()
  }

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setCurrentView('detail')
  }

  const handleCuisineChange = (cuisineId: string) => {
    setSelectedCuisine(cuisineId)
  }

  // Generate images for recipes
  useEffect(() => {
    const generateImages = async () => {
      for (const recipe of recipes) {
        if (!recipe.imagePrompt || recipeImageUrls[recipe.id]) continue
        try {
          const res = await fetch('/api/recipes/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: recipe.imagePrompt,
              recipeId: recipe.id.replace(/[^a-zA-Z0-9-]/g, ''),
            }),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.imageUrl) {
              setRecipeImageUrl(recipe.id, data.imageUrl)
            }
          }
        } catch (e) {
          console.error('Image error:', e)
        }
      }
    }
    if (recipes.length > 0) {
      generateImages()
    }
  }, [recipes, recipeImageUrls, setRecipeImageUrl])

  return (
    <div className="view-transition min-h-screen flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Explore Recipes</h1>
              <p className="text-[10px] text-gray-400">
                {pantryItems.length > 0
                  ? `Based on your ${pantryItems.length} pantry items`
                  : 'Discover delicious Indian recipes'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-orange-200 text-orange-600 h-8"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Cuisine filter tabs */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine.id}
              onClick={() => handleCuisineChange(cuisine.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCuisine === cuisine.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {cuisine.label}
              {cuisineCounts[cuisine.id] && selectedCuisine !== cuisine.id && (
                <span className="ml-1 text-[10px] opacity-60">({cuisineCounts[cuisine.id]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Pantry summary bar */}
        {pantryItems.length > 0 && (
          <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {pantryItems.slice(0, 8).map((item) => (
              <Badge
                key={item.id}
                variant="secondary"
                className="bg-orange-50 text-orange-700 text-[10px] flex-shrink-0 border border-orange-100"
              >
                {item.name}
              </Badge>
            ))}
            {pantryItems.length > 8 && (
              <Badge variant="secondary" className="bg-gray-50 text-gray-500 text-[10px] flex-shrink-0">
                +{pantryItems.length - 8} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Finding recipes for you...</h3>
            <p className="text-sm text-gray-400 mb-4">
              {selectedCuisine !== 'all' ? `Searching ${selectedCuisine} recipes` : 'Searching our recipe database'}
            </p>
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty pantry prompt */}
        {!isLoading && pantryItems.length === 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100/50 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">Add items to your pantry</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  We&apos;ll suggest recipes based on the ingredients you already have at home. The more items you add, the better the suggestions!
                </p>
                <Button
                  onClick={() => setCurrentView('pantry')}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Go to My Pantry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Match info */}
        {!isLoading && matchInfo && recipes.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3 text-orange-500" />
            {matchInfo.source === 'matched' && `Found ${matchInfo.matchedCount} recipes matching your ingredients`}
            {matchInfo.source === 'mixed' && `Some matches found + popular recipes`}
            {matchInfo.source === 'popular' && `Popular ${selectedCuisine !== 'all' ? selectedCuisine : ''} recipes — add more pantry items for better matches`}
          </div>
        )}

        {/* Recipe cards */}
        {!isLoading && recipes.map((recipe, index) => (
          <Card
            key={recipe.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] border-orange-100 slide-up"
            style={{ animationDelay: `${index * 60}ms` }}
            onClick={() => openRecipe(recipe)}
          >
            {/* Recipe Image */}
            <div className="h-44 relative overflow-hidden bg-gradient-to-br from-orange-400 to-amber-500">
              {recipeImageUrls[recipe.id] ? (
                <img
                  src={recipeImageUrls[recipe.id]}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-300 via-amber-200 to-orange-400">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-1 rounded-full bg-white/30 flex items-center justify-center animate-pulse">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-white/90 font-medium">Loading image...</span>
                  </div>
                </div>
              )}

              {/* Veg/Non-veg badge */}
              <div className="absolute top-3 left-3">
                <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                  recipe.isVegetarian
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {recipe.isVegetarian ? (
                    <><Leaf className="w-3 h-3" /> Veg</>
                  ) : (
                    <><Drumstick className="w-3 h-3" /> Non-Veg</>
                  )}
                </div>
              </div>

              {/* Match badge */}
              {(recipe as any).matchScore !== undefined && (recipe as any).matchScore > 0 && (
                <div className="absolute top-3 right-3">
                  <div className="px-2 py-1 rounded-md text-xs font-bold bg-white/90 text-orange-700">
                    {(recipe as any).matchScore}% match
                  </div>
                </div>
              )}

              {/* Cuisine badge */}
              <Badge className="absolute bottom-3 left-3 bg-white/90 text-orange-700 font-medium">
                {recipe.cuisine}
              </Badge>
            </div>

            <CardContent className="p-4">
              <h3 className="font-bold text-lg text-foreground mb-2">{recipe.title}</h3>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{recipe.prepTime} + {recipe.cookTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{recipe.servings} servings</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    recipe.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}
                >
                  <Flame className="w-3 h-3 mr-1" />
                  {recipe.difficulty}
                </Badge>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {recipe.tags?.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs border-orange-200 text-orange-600">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Missing ingredients indicator */}
              {(recipe as any).missingIngredients && (recipe as any).missingIngredients.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Missing ingredients</p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {(recipe as any).missingIngredients.slice(0, 4).join(', ')}
                    {(recipe as any).missingIngredients.length > 4 ? '...' : ''}
                  </p>
                </div>
              )}

              {/* Ingredients preview (if no missing info) */}
              {!(recipe as any).missingIngredients && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Key ingredients</p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {recipe.ingredients.slice(0, 5).join(', ')}{recipe.ingredients.length > 5 ? '...' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* No recipes found */}
        {!isLoading && recipes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-6xl mb-4">🍽️</span>
            <h2 className="text-xl font-semibold mb-2">No recipes found</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {selectedCuisine !== 'all'
                ? `No ${selectedCuisine} recipes match your ingredients yet. Try a different cuisine or add more pantry items.`
                : 'Try adding more ingredients or check back when we have more recipes'}
            </p>
            {selectedCuisine !== 'all' && (
              <Button
                variant="outline"
                className="border-orange-200 text-orange-600"
                onClick={() => setSelectedCuisine('all')}
              >
                View All Cuisines
              </Button>
            )}
          </div>
        )}

        {/* Browse more hint */}
        {!isLoading && recipes.length > 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">
              <Sparkles className="w-3 h-3 inline mr-1" />
              From our recipe database — add pantry items for personalized matches
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
