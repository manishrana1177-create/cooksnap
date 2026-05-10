'use client'

import { useAppStore } from '@/lib/store'
import { ArrowLeft, Plus, X, ChefHat, Sparkles, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

const categoryColors: Record<string, string> = {
  protein: 'bg-red-100 text-red-700 border-red-200',
  vegetable: 'bg-green-100 text-green-700 border-green-200',
  fruit: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  dairy: 'bg-blue-100 text-blue-700 border-blue-200',
  grain: 'bg-amber-100 text-amber-700 border-amber-200',
  spice: 'bg-orange-100 text-orange-700 border-orange-200',
  condiment: 'bg-purple-100 text-purple-700 border-purple-200',
  beverage: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}

const categories = ['protein', 'vegetable', 'fruit', 'dairy', 'grain', 'spice', 'condiment', 'beverage', 'other']

export default function ConfirmView() {
  const {
    setCurrentView,
    detectedIngredients,
    toggleIngredient,
    addManualIngredient,
    removeIngredient,
    manualInput,
    setManualInput,
    selectedCuisine,
    isGenerating,
    setIsGenerating,
    setRecipes,
    pantryItems,
    setPantryItems,
    usePantryIngredients,
    setUsePantryIngredients,
    scannedImage,
  } = useAppStore()

  const [selectedCategory, setSelectedCategory] = useState('other')
  const [savingToPantry, setSavingToPantry] = useState(false)

  const confirmedCount = detectedIngredients.filter((i) => i.confirmed).length

  // Determine where back button should go
  const goBack = () => {
    if (scannedImage) {
      setCurrentView('scanner')
    } else {
      setCurrentView('home')
    }
  }

  // Load pantry on mount
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

  const handleAddManual = () => {
    if (!manualInput.trim()) return
    const items = manualInput.split(',').map((s) => s.trim()).filter(Boolean)
    items.forEach((item) => {
      addManualIngredient(item, selectedCategory)
    })
    setManualInput('')
    toast({ title: 'Added!', description: `${items.length} ingredient(s) added` })
  }

  const handleSaveToPantry = async () => {
    const confirmedItems = detectedIngredients
      .filter((i) => i.confirmed)
      .map((i) => ({ name: i.name, category: i.category }))

    if (confirmedItems.length === 0) return

    setSavingToPantry(true)
    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: confirmedItems }),
      })
      if (res.ok) {
        const data = await res.json()
        setPantryItems(data.items || [])
        toast({ title: 'Saved to pantry!', description: `${confirmedItems.length} items saved` })
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setSavingToPantry(false)
    }
  }

  const handleGenerateRecipes = async () => {
    const confirmedIngredients = detectedIngredients
      .filter((i) => i.confirmed)
      .map((i) => i.name)

    if (confirmedIngredients.length === 0) {
      toast({
        title: 'No ingredients selected',
        description: 'Please add and confirm at least one ingredient',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const pantryNames = usePantryIngredients
        ? pantryItems.map((p) => p.name)
        : []

      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: confirmedIngredients,
          cuisine: selectedCuisine,
          pantryIngredients: pantryNames,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate recipes')
      }

      const data = await response.json()

      if (data.recipes && data.recipes.length > 0) {
        setRecipes(data.recipes)
        toast({
          title: 'Recipes ready!',
          description: `Found ${data.recipes.length} recipes for you`,
        })
        setCurrentView('results')
      } else {
        toast({
          title: 'No recipes found',
          description: 'Try adding more ingredients or changing the cuisine',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Could not generate recipes. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="view-transition min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Confirm Ingredients</h1>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            {confirmedCount} selected
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-5">
        {/* Detected ingredients */}
        {detectedIngredients.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Detected Ingredients
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-orange-600 h-7"
                onClick={handleSaveToPantry}
                disabled={savingToPantry || confirmedCount === 0}
              >
                <Save className="w-3 h-3 mr-1" />
                {savingToPantry ? 'Saving...' : 'Save to Pantry'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Tap to toggle on/off. Tap X to remove.
            </p>
            <div className="flex flex-wrap gap-2">
              {detectedIngredients.map((ingredient) => (
                <div
                  key={ingredient.name}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all border ${
                    ingredient.confirmed
                      ? categoryColors[ingredient.category] || categoryColors.other
                      : 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                  }`}
                  onClick={() => toggleIngredient(ingredient.name)}
                >
                  {ingredient.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeIngredient(ingredient.name)
                    }}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state prompt */}
        {detectedIngredients.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-800 font-medium mb-1">No ingredients yet</p>
            <p className="text-xs text-amber-600">
              Add your ingredients below using the text input, or go back and scan your fridge
            </p>
          </div>
        )}

        {/* Pantry toggle */}
        {pantryItems.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 text-sm">Use My Pantry</h3>
                <p className="text-xs text-green-600">
                  Include {pantryItems.length} saved ingredients
                </p>
              </div>
              <Button
                variant={usePantryIngredients ? 'default' : 'outline'}
                size="sm"
                className={usePantryIngredients ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700'}
                onClick={() => setUsePantryIngredients(!usePantryIngredients)}
              >
                {usePantryIngredients ? 'Included' : 'Include'}
              </Button>
            </div>
            {usePantryIngredients && (
              <div className="flex flex-wrap gap-1 mt-2">
                {pantryItems.map((item) => (
                  <Badge key={item.id} variant="secondary" className="text-xs bg-green-100 text-green-700">
                    {item.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual add */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Add Ingredients Manually
          </h2>

          {/* Category selector */}
          <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? categoryColors[cat]
                    : 'bg-gray-50 text-gray-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. chicken, rice, tomatoes"
              className="flex-1 border-orange-200 focus:border-orange-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddManual()
              }}
            />
            <Button
              onClick={handleAddManual}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!manualInput.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Separate multiple items with commas
          </p>
        </div>

        {/* Generate button */}
        <div className="mt-auto pb-6">
          <Button
            onClick={handleGenerateRecipes}
            disabled={confirmedCount === 0 || isGenerating}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-base py-6 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Recipes...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Find Recipes ({confirmedCount} ingredient{confirmedCount !== 1 ? 's' : ''})
              </>
            )}
          </Button>
          {isGenerating && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              <ChefHat className="w-3 h-3 inline mr-1" />
              AI chef is creating recipes based on your ingredients...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
