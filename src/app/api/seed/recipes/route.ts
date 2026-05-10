import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const maxDuration = 300 // 5 minutes per request

// This endpoint generates recipes for a specific cuisine and saves to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cuisine, count = 10, category = 'main' } = body as {
      cuisine: string
      count?: number
      category?: string
    }

    if (!cuisine) {
      return NextResponse.json({ error: 'Cuisine is required' }, { status: 400 })
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const prompt = `Generate exactly ${count} authentic ${cuisine} recipes in the "${category}" category.

Return ONLY a valid JSON array, no markdown, no code fences, no extra text:
[{
  "title": "Recipe Name",
  "cuisine": "${cuisine}",
  "prepTime": "X mins",
  "cookTime": "X mins",
  "servings": 2,
  "difficulty": "easy|medium|hard",
  "isVegetarian": true/false,
  "ingredients": ["2 cups rice", "1 onion chopped", "1 tsp turmeric", ...],
  "ingredientNames": ["rice", "onion", "turmeric", ...],
  "steps": ["Step 1: ...", "Step 2: ...", ...],
  "tags": ["tag1", "tag2", ...],
  "imagePrompt": "professional food photography of [dish], plated beautifully, warm lighting",
  "popularity": 50
}]

CRITICAL RULES:
- ingredientNames must be a simple array of common ingredient names WITHOUT quantities (e.g. "rice", "chicken", "tomato", "turmeric"). These are used for matching against user's pantry.
- ingredients must include quantities (e.g. "2 cups rice", "500g chicken")
- Each recipe must have at least 4 steps
- Include a good mix of vegetarian and non-vegetarian recipes
- Make recipes authentic to ${cuisine} cuisine
- popularity should be 70-100 for very famous dishes, 40-70 for well-known, 10-40 for less common
- Ensure NO duplicate recipe titles within this batch`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert chef and recipe database creator. You create authentic, diverse recipes from world cuisines. Always return valid JSON arrays only.' },
        { role: 'user', content: prompt },
      ],
    })

    const responseText = completion.choices[0]?.message?.content || '[]'

    // Clean response
    let cleanedText = responseText.trim()
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No JSON array found in AI response', saved: 0 })
    }

    const recipes = JSON.parse(jsonMatch[0])
    let saved = 0
    const errors: string[] = []

    for (const recipe of recipes) {
      try {
        if (!recipe.title || !recipe.ingredients || !recipe.steps) continue

        const ingredientNames = recipe.ingredientNames || extractIngredientNames(recipe.ingredients)

        // Check if recipe with same title already exists
        const existing = await db.recipe.findFirst({ where: { title: recipe.title } })
        if (existing) continue

        await db.recipe.create({
          data: {
            title: recipe.title,
            cuisine: recipe.cuisine || cuisine,
            cookTime: recipe.cookTime || '30 mins',
            prepTime: recipe.prepTime || '15 mins',
            servings: recipe.servings || 2,
            difficulty: recipe.difficulty || 'easy',
            isVegetarian: recipe.isVegetarian ?? true,
            ingredients: JSON.stringify(recipe.ingredients),
            ingredientNames: JSON.stringify(ingredientNames),
            steps: JSON.stringify(recipe.steps),
            tags: JSON.stringify(recipe.tags || []),
            imagePrompt: recipe.imagePrompt || `professional food photography of ${recipe.title}, plated beautifully, warm lighting`,
            category: recipe.category || category,
            popularity: recipe.popularity || 50,
            isAIGenerated: true,
          },
        })
        saved++
      } catch (error: any) {
        errors.push(`${recipe.title}: ${error.message}`)
      }
    }

    const totalInDb = await db.recipe.count()

    return NextResponse.json({
      cuisine,
      generated: recipes.length,
      saved,
      totalInDb,
      errors: errors.length > 0 ? errors.slice(0, 3) : undefined,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed recipes' },
      { status: 500 }
    )
  }
}

// GET - check seeding status
export async function GET() {
  try {
    const total = await db.recipe.count()
    const byCuisine = await db.recipe.groupBy({
      by: ['cuisine'],
      _count: { cuisine: true },
      orderBy: { _count: { cuisine: 'desc' } },
    })

    return NextResponse.json({
      total,
      byCuisine: byCuisine.map((c) => ({ cuisine: c.cuisine, count: c._count.cuisine })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}

function extractIngredientNames(ingredients: string[]): string[] {
  return ingredients.map((ing: string) => {
    return ing
      .replace(/^\d+[\d/\s]*\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pounds?|pieces?|cloves?|inches?|slices?|cans?|bunches?|sprigs?|stalks?|heads?|pinch|dash|handful)\s*/i, '')
      .replace(/^[\d/\s]+\s*/, '')
      .replace(/,\s*.*$/, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*(chopped|diced|minced|grated|sliced|crushed|ground|powdered|fresh|dried|boiled|mashed|finely|coarsely)\s*/gi, '')
      .trim()
      .toLowerCase()
  }).filter((name: string) => name.length > 1)
}
