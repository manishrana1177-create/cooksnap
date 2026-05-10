'use client'

import { useAppStore, type Recipe } from '@/lib/store'
import { ArrowLeft, Clock, Users, Flame, Leaf, Drumstick, Compass, Sparkles, ChefHat, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

const sampleExploreRecipes: Recipe[] = [
  {
    id: 'explore-sample-1',
    title: 'Masala Dosa',
    cuisine: 'Indian',
    cookTime: '15 min',
    prepTime: '20 min',
    servings: 4,
    difficulty: 'Medium',
    isVegetarian: true,
    ingredients: [
      '2 cups rice batter',
      '1 cup urad dal batter',
      '2 potatoes, boiled & mashed',
      '1 onion, sliced',
      '1 tsp mustard seeds',
      '1 tsp chana dal',
      '8-10 curry leaves',
      '2 green chillies, chopped',
      '1/2 tsp turmeric',
      'Oil for cooking',
      'Salt to taste',
    ],
    steps: [
      'Mix rice and urad dal batter together with salt. Let it ferment for 8 hours or overnight.',
      'For the filling, heat oil in a pan. Add mustard seeds, chana dal, and curry leaves. Let them splutter.',
      'Add sliced onions and green chillies. Sauté until onions are translucent and slightly golden.',
      'Add turmeric and mashed potatoes. Mix well, season with salt, and cook for 2-3 minutes. Set aside.',
      'Heat a flat tawa or griddle. Pour a ladleful of batter and spread it thin in a circular motion from center outward.',
      'Drizzle a little oil around the edges and on top. Cook until the bottom is golden and crispy.',
      'Place a spoonful of potato filling in the center. Fold the dosa over and serve hot with coconut chutney and sambar.',
    ],
    tags: ['South Indian', 'Breakfast', 'Crispy', 'Classic'],
    imagePrompt: 'crispy golden masala dosa with potato filling and coconut chutney on the side',
  },
  {
    id: 'explore-sample-2',
    title: 'Butter Chicken',
    cuisine: 'Indian',
    cookTime: '30 min',
    prepTime: '15 min',
    servings: 4,
    difficulty: 'Medium',
    isVegetarian: false,
    ingredients: [
      '500g chicken, boneless',
      '1 cup yogurt',
      '2 tbsp butter',
      '1 tbsp oil',
      '1 onion, chopped',
      '2 tomatoes, pureed',
      '1 tbsp ginger-garlic paste',
      '1 tsp garam masala',
      '1 tsp red chilli powder',
      '1/2 cup cream',
      '1 tsp kasuri methi',
      'Salt to taste',
      'Fresh coriander for garnish',
    ],
    steps: [
      'Marinate chicken in yogurt, salt, and red chilli powder for at least 30 minutes.',
      'Grill or pan-sear the marinated chicken until slightly charred. Set aside.',
      'In the same pan, melt butter with oil. Add onions and cook until golden brown.',
      'Add ginger-garlic paste and cook for 1 minute. Add tomato puree and cook until oil separates.',
      'Add garam masala, kasuri methi, and cream. Stir well and simmer for 2 minutes.',
      'Add the grilled chicken pieces. Simmer on low heat for 10 minutes until chicken is cooked through.',
      'Garnish with fresh coriander and a drizzle of cream. Serve with naan or steamed rice.',
    ],
    tags: ['North Indian', 'Rich & Creamy', 'Restaurant Style', 'Popular'],
    imagePrompt: 'rich creamy orange butter chicken curry in a bowl with fresh naan bread',
  },
  {
    id: 'explore-sample-3',
    title: 'Vegetable Stir Fry',
    cuisine: 'Chinese',
    cookTime: '10 min',
    prepTime: '10 min',
    servings: 3,
    difficulty: 'Easy',
    isVegetarian: true,
    ingredients: [
      '1 bell pepper, sliced',
      '1 carrot, julienned',
      '1 cup broccoli florets',
      '1/2 cup snap peas',
      '2 cloves garlic, minced',
      '1 inch ginger, julienned',
      '2 tbsp soy sauce',
      '1 tbsp vinegar',
      '1 tsp sesame oil',
      '1 tbsp cornstarch',
      '2 tbsp vegetable oil',
      'Spring onions for garnish',
    ],
    steps: [
      'Mix soy sauce, vinegar, sesame oil, and cornstarch in a small bowl to make the sauce. Set aside.',
      'Heat vegetable oil in a wok over high heat until smoking hot.',
      'Add garlic and ginger. Stir fry for 15 seconds until fragrant — do not burn.',
      'Add carrots and broccoli first (they take longer). Stir fry for 2 minutes on high heat.',
      'Add bell pepper and snap peas. Stir fry for another 1-2 minutes, keeping vegetables crisp.',
      'Pour in the sauce mixture. Toss everything quickly so the sauce coats all vegetables evenly.',
      'Garnish with spring onions and serve immediately with steamed rice or noodles.',
    ],
    tags: ['Quick & Easy', 'Healthy', 'Weeknight Dinner', 'Veggie Packed'],
    imagePrompt: 'colorful vegetable stir fry with broccoli bell peppers and snap peas on a plate',
  },
  {
    id: 'explore-sample-4',
    title: 'Rajma Chawal',
    cuisine: 'Indian',
    cookTime: '40 min',
    prepTime: '10 min',
    servings: 4,
    difficulty: 'Easy',
    isVegetarian: true,
    ingredients: [
      '1 cup kidney beans (rajma), soaked overnight',
      '2 onions, chopped',
      '3 tomatoes, pureed',
      '1 tbsp ginger-garlic paste',
      '1 tsp cumin seeds',
      '1 tsp coriander powder',
      '1 tsp garam masala',
      '1/2 tsp turmeric',
      '1 tsp red chilli powder',
      '2 tbsp oil',
      'Fresh coriander for garnish',
      'Salt to taste',
    ],
    steps: [
      'Pressure cook soaked rajma with salt and enough water until soft and tender (about 4-5 whistles).',
      'Heat oil in a pan. Add cumin seeds and let them splutter. Add onions and cook until golden.',
      'Add ginger-garlic paste and cook for 1 minute. Add tomato puree and cook until oil separates.',
      'Add turmeric, coriander powder, red chilli powder, and salt. Cook for 2 minutes.',
      'Add the boiled rajma along with its cooking water. Simmer for 15-20 minutes on medium heat.',
      'Mash some beans with the back of a spoon to thicken the gravy. Add garam masala and mix.',
      'Garnish with fresh coriander. Serve hot with steamed basmati rice and a side of onion salad.',
    ],
    tags: ['Comfort Food', 'North Indian', 'Protein Rich', 'Home Style'],
    imagePrompt: 'thick rich rajma curry served over steamed basmati rice with fresh coriander garnish',
  },
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
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasLoadedPantry, setHasLoadedPantry] = useState(false)

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
      } finally {
        setHasLoadedPantry(true)
      }
    }
    loadPantry()
  }, [setPantryItems])

  // Auto-generate recipes when pantry has items
  useEffect(() => {
    if (hasLoadedPantry && pantryItems.length > 0 && recipes.length === 0 && !isGenerating) {
      generateRecipes()
    } else if (hasLoadedPantry && pantryItems.length === 0) {
      setRecipes(sampleExploreRecipes)
    }
  }, [hasLoadedPantry, pantryItems.length])

  const generateRecipes = useCallback(async () => {
    if (pantryItems.length === 0) {
      setRecipes(sampleExploreRecipes)
      return
    }

    setIsGenerating(true)
    try {
      const ingredientNames = pantryItems.map((p) => p.name)
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredientNames,
          cuisine: 'global',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate recipes')
      }

      const data = await response.json()
      if (data.recipes && data.recipes.length > 0) {
        setRecipes(data.recipes)
      } else {
        setRecipes(sampleExploreRecipes)
      }
    } catch (error) {
      console.error(error)
      setRecipes(sampleExploreRecipes)
      toast({ title: 'Using sample recipes', description: 'Could not generate custom recipes' })
    } finally {
      setIsGenerating(false)
    }
  }, [pantryItems])

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setCurrentView('detail')
  }

  // Generate images for recipes (same pattern as ResultsView)
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
          console.error('Image generation error for', recipe.title, e)
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
                  : 'Discover delicious recipes'}
              </p>
            </div>
          </div>
          {pantryItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-orange-200 text-orange-600 h-8"
              onClick={generateRecipes}
              disabled={isGenerating}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
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
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Finding recipes for you...</h3>
            <p className="text-sm text-gray-400 mb-4">Using your pantry ingredients</p>
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty pantry prompt */}
        {!isGenerating && pantryItems.length === 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100/50 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-orange-500" />
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

        {/* Recipe cards */}
        {!isGenerating && recipes.map((recipe, index) => (
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

              {/* Ingredients preview */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Key ingredients</p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {recipe.ingredients.slice(0, 5).join(', ')}{recipe.ingredients.length > 5 ? '...' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Sample recipes label */}
        {!isGenerating && recipes.length > 0 && pantryItems.length === 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Popular recipes — add pantry items for personalized suggestions
            </p>
          </div>
        )}

        {/* Generated recipes label */}
        {!isGenerating && recipes.length > 0 && pantryItems.length > 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">
              <Sparkles className="w-3 h-3 inline mr-1" />
              AI-suggested recipes from your pantry ingredients
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
