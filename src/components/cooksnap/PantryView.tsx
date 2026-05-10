'use client'

import { useAppStore, type PantryItem } from '@/lib/store'
import { ArrowLeft, Trash2, Plus, Refrigerator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
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

const categories = ['protein', 'vegetable', 'fruit', 'dairy', 'grain', 'spice', 'condiment', 'beverage', 'other']

export default function PantryView() {
  const { setCurrentView, pantryItems, setPantryItems } = useAppStore()
  const [newItem, setNewItem] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('other')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPantry()
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

  const handleAdd = async () => {
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
    <div className="view-transition min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('home')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
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
        <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'bg-gray-50 text-gray-500'
              }`}
            >
              {categoryIcons[cat]} {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add items (comma separated)"
            className="flex-1 border-orange-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
          <Button
            onClick={handleAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!newItem.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
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
            <p className="text-muted-foreground text-sm mb-4">
              Add ingredients you always have at home
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
