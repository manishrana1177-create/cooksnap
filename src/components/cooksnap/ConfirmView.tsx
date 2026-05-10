'use client'

import { useAppStore } from '@/lib/store'
import { searchIngredients, getIngredientDisplayName, type IngredientEntry } from '@/lib/ingredients'
import { ArrowLeft, Plus, X, ChefHat, Sparkles, Save, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useRef } from 'react'
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

const dietOptions = [
  { id: 'all', label: '🍽️ All', color: 'bg-orange-100 text-orange-700' },
  { id: 'veg', label: '🟢 Veg', color: 'bg-green-100 text-green-700' },
  { id: 'nonveg', label: '🔴 Non-Veg', color: 'bg-red-100 text-red-700' },
]

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
    setSelectedCuisine,
    isGenerating,
    setIsGenerating,
    setRecipes,
    pantryItems,
    setPantryItems,
    usePantryIngredients,
    setUsePantryIngredients,
    dietFilter,
    setDietFilter,
    scannedImage,
  } = useAppStore()

  const [selectedCategory, setSelectedCategory] = useState('other')
  const [savingToPantry, setSavingToPantry] = useState(false)
  const [suggestions, setSuggestions] = useState<IngredientEntry[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const confirmedCount = detectedIngredients.filter((i) => i.confirmed).length

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

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (value: string) => {
    setManualInput(value)
    if (value.trim().length > 0) {
      const results = searchIngredients(value)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setHighlightedIndex(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (item: IngredientEntry) => {
    // Check if already added
    const alreadyAdded = detectedIngredients.some(
      (i) => i.name.toLowerCase() === item.english.toLowerCase()
    )
    if (!alreadyAdded) {
      addManualIngredient(item.english, item.category)
      toast({ title: 'Added!', description: `${getIngredientDisplayName(item.english)} added` })
    } else {
      toast({ title: 'Already added', description: `${item.english} is already in your list` })
    }
    setManualInput('')
    setShowSuggestions(false)
    setSuggestions([])
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        selectSuggestion(suggestions[highlightedIndex])
      } else {
        handleAddManual()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleAddManual = () => {
    if (!manualInput.trim()) return
    const items = manualInput.split(',').map((s) => s.trim()).filter(Boolean)
    items.forEach((item) => {
      addManualIngredient(item, selectedCategory)
    })
    setManualInput('')
    setShowSuggestions(false)
    setSuggestions([])
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
          dietFilter,
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
          description: data.warning || 'Try adding more ingredients or changing the cuisine',
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
            <Button variant="ghost" size="icon" onClick={goBack} className="text-foreground">
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
                Your Ingredients
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
              Tap to toggle. Tap X to remove.
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

        {/* Empty state */}
        {detectedIngredients.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-800 font-medium mb-1">No ingredients yet</p>
            <p className="text-xs text-amber-600">
              Search or type your ingredients below — supports English & Hinglish (e.g. &quot;aloo&quot;, &quot;pyaz&quot;, &quot;paneer&quot;)
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
          </div>
        )}

        {/* Manual add with autocomplete */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Add Ingredients
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

          {/* Input with autocomplete dropdown */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={inputRef}
                  value={manualInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder='Type ingredient (e.g. "aloo", "chicken", "tamatar")'
                  className="pl-9 border-orange-200 focus:border-orange-400"
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (manualInput.trim() && suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleAddManual}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!manualInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 top-12 left-0 right-12 bg-white border border-orange-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
              >
                {suggestions.map((item, index) => (
                  <button
                    key={item.english}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === highlightedIndex
                        ? 'bg-orange-50'
                        : 'hover:bg-orange-50/50'
                    } ${index !== suggestions.length - 1 ? 'border-b border-orange-100' : ''}`}
                    onClick={() => selectSuggestion(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {item.english}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.hinglish.filter((h) => h.toLowerCase() !== item.english.toLowerCase()).join(', ')}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${categoryColors[item.category]?.split(' ')[0] || ''} ${categoryColors[item.category]?.split(' ')[1] || ''}`}
                    >
                      {item.category}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Supports English &amp; Hinglish — try &quot;aloo&quot;, &quot;pyaz&quot;, &quot;paneer&quot;, &quot;chawal&quot;
          </p>
        </div>

        {/* Diet Filter */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Diet Preference
          </h2>
          <div className="flex gap-2">
            {dietOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDietFilter(opt.id as 'all' | 'veg' | 'nonveg')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  dietFilter === opt.id
                    ? `${opt.color} border-current shadow-sm`
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine Selector */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Cuisine Style
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {[
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
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCuisine(c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCuisine === c.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-orange-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
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
              AI chef is creating {dietFilter === 'veg' ? 'vegetarian' : dietFilter === 'nonveg' ? 'non-vegetarian' : ''} recipes...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
