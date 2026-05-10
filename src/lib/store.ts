import { create } from 'zustand'

export type AppView = 'home' | 'scanner' | 'confirm' | 'results' | 'detail' | 'pantry' | 'favorites'

export interface DetectedIngredient {
  name: string
  confirmed: boolean
  category: string
}

export interface Recipe {
  id: string
  title: string
  cuisine: string
  cookTime: string
  prepTime: string
  servings: number
  difficulty: string
  ingredients: string[]
  steps: string[]
  tags: string[]
  imagePrompt: string
}

export interface PantryItem {
  id: string
  name: string
  category: string
  createdAt: string
}

export interface FavoriteRecipe {
  id: string
  title: string
  cuisine: string
  cookTime: string
  prepTime: string
  servings: number
  difficulty: string
  ingredients: string[]
  steps: string[]
  tags: string[]
  imagePrompt: string
  createdAt: string
}

interface AppState {
  // Navigation
  currentView: AppView
  setCurrentView: (view: AppView) => void

  // Scanner
  scannedImage: string | null
  setScannedImage: (image: string | null) => void
  detectedIngredients: DetectedIngredient[]
  setDetectedIngredients: (ingredients: DetectedIngredient[]) => void
  toggleIngredient: (name: string) => void
  addManualIngredient: (name: string, category: string) => void
  removeIngredient: (name: string) => void

  // Cuisine
  selectedCuisine: string
  setSelectedCuisine: (cuisine: string) => void

  // Recipes
  recipes: Recipe[]
  setRecipes: (recipes: Recipe[]) => void
  selectedRecipe: Recipe | null
  setSelectedRecipe: (recipe: Recipe | null) => void

  // Pantry
  pantryItems: PantryItem[]
  setPantryItems: (items: PantryItem[]) => void
  usePantryIngredients: boolean
  setUsePantryIngredients: (use: boolean) => void

  // Favorites
  favorites: FavoriteRecipe[]
  setFavorites: (favorites: FavoriteRecipe[]) => void

  // Loading states
  isScanning: boolean
  setIsScanning: (loading: boolean) => void
  isGenerating: boolean
  setIsGenerating: (loading: boolean) => void

  // Cooking mode
  cookingStep: number
  setCookingStep: (step: number) => void

  // Manual ingredient input
  manualInput: string
  setManualInput: (input: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),

  // Scanner
  scannedImage: null,
  setScannedImage: (image) => set({ scannedImage: image }),
  detectedIngredients: [],
  setDetectedIngredients: (ingredients) => set({ detectedIngredients: ingredients }),
  toggleIngredient: (name) =>
    set((state) => ({
      detectedIngredients: state.detectedIngredients.map((ing) =>
        ing.name === name ? { ...ing, confirmed: !ing.confirmed } : ing
      ),
    })),
  addManualIngredient: (name, category) =>
    set((state) => ({
      detectedIngredients: [
        ...state.detectedIngredients,
        { name, confirmed: true, category },
      ],
    })),
  removeIngredient: (name) =>
    set((state) => ({
      detectedIngredients: state.detectedIngredients.filter((ing) => ing.name !== name),
    })),

  // Cuisine
  selectedCuisine: 'global',
  setSelectedCuisine: (cuisine) => set({ selectedCuisine: cuisine }),

  // Recipes
  recipes: [],
  setRecipes: (recipes) => set({ recipes }),
  selectedRecipe: null,
  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),

  // Pantry
  pantryItems: [],
  setPantryItems: (items) => set({ pantryItems: items }),
  usePantryIngredients: false,
  setUsePantryIngredients: (use) => set({ usePantryIngredients: use }),

  // Favorites
  favorites: [],
  setFavorites: (favorites) => set({ favorites }),

  // Loading
  isScanning: false,
  setIsScanning: (loading) => set({ isScanning: loading }),
  isGenerating: false,
  setIsGenerating: (loading) => set({ isGenerating: loading }),

  // Cooking
  cookingStep: 0,
  setCookingStep: (step) => set({ cookingStep: step }),

  // Manual input
  manualInput: '',
  setManualInput: (input) => set({ manualInput: input }),
}))
