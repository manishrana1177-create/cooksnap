'use client'

import { useAppStore, type PantryItem } from '@/lib/store'
import { searchIngredients, getIngredientDisplayName, type IngredientEntry } from '@/lib/ingredients'
import { Trash2, Plus, Refrigerator, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useRef } from 'react'
import { toast } from '@/hooks/use-toast'

const categoryIcons: Record<string, string> = {
  protein: '🥩',
  vegetable: '🥬',
  fruit: '🍎',
  dairy: '🧀',
  grain: '🌾',
  spice: '🌶️',
  condiment: '🧴',
  beverage: '🥤',
  other: '📦',
}

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

export default function PantryView() {
  const { pantryItems, setPantryItems } = useAppStore()
  const [newItem, setNewItem] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('other')
  const [isLoading, setIsLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<IngredientEntry[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPantry()
  }, [])

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

  const loadPantry = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/pantry')
      if (res.ok) {
        const data = await res.json()
        setPantryItems(data.items || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setNewItem(value)
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

  const selectSuggestion = async (item: IngredientEntry) => {
    // Check if already in pantry
    const alreadyAdded = pantryItems.some(
      (p) => p.name.toLowerCase() === item.english.toLowerCase()
    )
    if (alreadyAdded) {
      toast({ title: 'Already in pantry', description: `${item.english} is already in your pantry` })
      setNewItem('')
      setShowSuggestions(false)
      setSuggestions([])
      inputRef.current?.focus()
      return
    }

    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ name: item.english, category: item.category }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPantryItems(data.items || [])
        toast({ title: 'Added to pantry!', description: `${getIngredientDisplayName(item.english)} saved` })
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Failed to add', variant: 'destructive' })
    }

    setNewItem('')
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

  const handleAddManual = async () => {
    if (!newItem.trim()) return
    const items = newItem.split(',').map((s) => s.trim()).filter(Boolean)
    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((name) => ({ name, category: selectedCategory })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPantryItems(data.items || [])
        setNewItem('')
        setShowSuggestions(false)
        setSuggestions([])
        toast({ title: 'Added to pantry!', description: `${items.length} item(s) saved` })
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Failed to add', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pantry?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        setPantryItems(data.items || [])
        toast({ title: 'Item removed' })
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Failed to remove', variant: 'destructive' })
    }
  }

  // Group by category
  const grouped = pantryItems.reduce<Record<string, PantryItem[]>>((acc, item) => {
    const cat = item.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="view-transition min-h-screen flex flex-col bg-gray-50/50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold">My Pantry</h1>
              <p className="text-xs text-muted-foreground">{pantryItems.length} items saved</p>
            </div>
          </div>
          <Refrigerator className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      {/* Add Item */}
      <div className="px-4 py-4 border-b">
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
              {categoryIcons[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Input with autocomplete */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={inputRef}
                value={newItem}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder='Add items (e.g. "aloo", "pyaz", "paneer")'
                className="pl-9 border-orange-200 focus:border-orange-400"
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (newItem.trim() && suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
              />
            </div>
            <Button
              onClick={handleAddManual}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!newItem.trim()}
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
              {suggestions.map((item, index) => {
                const alreadyInPantry = pantryItems.some(
                  (p) => p.name.toLowerCase() === item.english.toLowerCase()
                )
                return (
                  <button
                    key={item.english}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === highlightedIndex
                        ? 'bg-orange-50'
                        : 'hover:bg-orange-50/50'
                    } ${alreadyInPantry ? 'opacity-50' : ''} ${index !== suggestions.length - 1 ? 'border-b border-orange-100' : ''}`}
                    onClick={() => selectSuggestion(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {item.english}
                        {alreadyInPantry && (
                          <span className="text-xs text-muted-foreground ml-2">(in pantry)</span>
                        )}
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
                )
              })}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Supports English &amp; Hinglish — try &quot;aloo&quot;, &quot;pyaz&quot;, &quot;paneer&quot;, &quot;chawal&quot;
        </p>
      </div>

      {/* Pantry Items */}
      <div className="flex-1 px-4 py-4 overflow-y-auto pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pantryItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-6xl mb-4">🧺</span>
            <h2 className="text-xl font-semibold mb-2">Your pantry is empty</h2>
            <p className="text-muted-foreground text-sm mb-1">
              Add ingredients you always have at home
            </p>
            <p className="text-muted-foreground text-xs">
              Search in English or Hinglish — &quot;aloo&quot;, &quot;pyaz&quot;, &quot;paneer&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {categoryIcons[category] || '📦'} {category}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-orange-50/50 hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
