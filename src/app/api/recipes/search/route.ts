import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const maxDuration = 30

// Search recipes by matching pantry ingredients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ingredients, cuisine, category, limit = 20, offset = 0 } = body as {
      ingredients: string[]
      cuisine?: string
      category?: string
      limit?: number
      offset?: number
    }

    if (!ingredients || ingredients.length === 0) {
      // Return popular recipes if no ingredients specified
      const recipes = await db.recipe.findMany({
        where: buildWhereClause({ cuisine, category }),
        orderBy: { popularity: 'desc' },
        take: limit,
        skip: offset,
      })
      const total = await db.recipe.count({ where: buildWhereClause({ cuisine, category }) })
      return NextResponse.json({ recipes: recipes.map(formatRecipe), total, source: 'popular' })
    }

    // Normalize ingredients for matching
    const normalizedIngredients = ingredients.map((i) => i.toLowerCase().trim())

    // Get all recipes (filtered by cuisine/category if specified)
    const allRecipes = await db.recipe.findMany({
      where: buildWhereClause({ cuisine, category }),
    })

    // Score each recipe by how many ingredients match
    const scored = allRecipes.map((recipe) => {
      const recipeIngredients: string[] = JSON.parse(recipe.ingredientNames || '[]')
      const matchedIngredients = recipeIngredients.filter((ri) =>
        normalizedIngredients.some((ui) => {
          // Exact match
          if (ri.toLowerCase() === ui) return true
          // Partial match (e.g., "chicken" matches "chicken breast")
          if (ri.toLowerCase().includes(ui) || ui.includes(ri.toLowerCase())) return true
          // Common alias matching
          return false
        })
      )

      const matchCount = matchedIngredients.length
      const totalIngredients = recipeIngredients.length
      const matchScore = totalIngredients > 0 ? matchCount / totalIngredients : 0
      const missingIngredients = recipeIngredients.filter(
        (ri) => !matchedIngredients.includes(ri)
      )

      return {
        recipe,
        matchCount,
        totalIngredients,
        matchScore,
        matchedIngredients,
        missingIngredients,
      }
    })

    // Filter: show recipes where at least 1 ingredient matches and match score >= 20%
    const filtered = scored
      .filter((s) => s.matchCount > 0 && s.matchScore >= 0.2)
      .sort((a, b) => {
        // Sort by match count first, then by popularity
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
        return b.recipe.popularity - a.recipe.popularity
      })

    // If not enough matches, add popular recipes
    let results = filtered.slice(0, limit)
    let source = 'matched'

    if (results.length < 5) {
      // Fill with popular recipes
      const matchedIds = new Set(results.map((r) => r.recipe.id))
      const popular = allRecipes
        .filter((r) => !matchedIds.has(r.id))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit - results.length)
        .map((recipe) => ({
          recipe,
          matchCount: 0,
          totalIngredients: (JSON.parse(recipe.ingredientNames || '[]') as string[]).length,
          matchScore: 0,
          matchedIngredients: [] as string[],
          missingIngredients: JSON.parse(recipe.ingredientNames || '[]') as string[],
        }))

      results = [...results, ...popular]
      source = results.some((r) => r.matchCount > 0) ? 'mixed' : 'popular'
    }

    const total = filtered.length

    return NextResponse.json({
      recipes: results.map((r) => ({
        ...formatRecipe(r.recipe),
        matchCount: r.matchCount,
        totalIngredients: r.totalIngredients,
        matchScore: Math.round(r.matchScore * 100),
        matchedIngredients: r.matchedIngredients,
        missingIngredients: r.missingIngredients,
      })),
      total,
      source,
      pantryIngredients: normalizedIngredients,
    })
  } catch (error) {
    console.error('Recipe search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}

// GET - browse recipes with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get('cuisine') || undefined
    const category = searchParams.get('category') || undefined
    const vegetarian = searchParams.get('vegetarian') === 'true' ? true : undefined
    const difficulty = searchParams.get('difficulty') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('q') || undefined

    const where = buildWhereClause({ cuisine, category, vegetarian, difficulty, search })

    const [recipes, total] = await Promise.all([
      db.recipe.findMany({
        where,
        orderBy: { popularity: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.recipe.count({ where }),
    ])

    return NextResponse.json({
      recipes: recipes.map(formatRecipe),
      total,
    })
  } catch (error) {
    console.error('Recipe browse error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Browse failed' },
      { status: 500 }
    )
  }
}

function buildWhereClause(filters: {
  cuisine?: string
  category?: string
  vegetarian?: boolean
  difficulty?: string
  search?: string
}) {
  const where: Record<string, unknown> = {}

  if (filters.cuisine && filters.cuisine !== 'global') {
    where.cuisine = { contains: filters.cuisine, mode: 'insensitive' }
  }
  if (filters.category) {
    where.category = filters.category
  }
  if (filters.vegetarian !== undefined) {
    where.isVegetarian = filters.vegetarian
  }
  if (filters.difficulty) {
    where.difficulty = filters.difficulty
  }
  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' }
  }

  return where
}

function formatRecipe(recipe: Record<string, unknown>) {
  return {
    id: recipe.id as string,
    title: recipe.title as string,
    cuisine: recipe.cuisine as string,
    cookTime: recipe.cookTime as string,
    prepTime: recipe.prepTime as string,
    servings: recipe.servings as number,
    difficulty: recipe.difficulty as string,
    isVegetarian: recipe.isVegetarian as boolean,
    ingredients: JSON.parse((recipe.ingredients as string) || '[]'),
    ingredientNames: JSON.parse((recipe.ingredientNames as string) || '[]'),
    steps: JSON.parse((recipe.steps as string) || '[]'),
    tags: JSON.parse((recipe.tags as string) || '[]'),
    imagePrompt: recipe.imagePrompt as string,
    category: recipe.category as string,
    popularity: recipe.popularity as number,
  }
}
