import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ingredients, cuisine, pantryIngredients, dietFilter } = body as {
      ingredients: string[]
      cuisine: string
      pantryIngredients?: string[]
      dietFilter?: string // 'all' | 'veg' | 'nonveg'
    }

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'No ingredients provided' },
        { status: 400 }
      )
    }

    const allIngredients = pantryIngredients && pantryIngredients.length > 0
      ? [...new Set([...ingredients, ...pantryIngredients])]
      : ingredients

    const cuisineContext = cuisine && cuisine !== 'global'
      ? `in ${cuisine} cuisine style`
      : 'in any global cuisine style'

    const dietContext = dietFilter === 'veg'
      ? 'IMPORTANT: All recipes MUST be vegetarian (no meat, fish, or eggs). Include paneer, tofu, lentils, and vegetable-based dishes.'
      : dietFilter === 'nonveg'
      ? 'IMPORTANT: All recipes MUST be non-vegetarian (include at least one type of meat or fish).'
      : 'Include a mix of vegetarian and non-vegetarian recipes.'

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a creative chef AI that generates recipes based on available ingredients. Generate 5-6 delicious recipes using the provided ingredients ${cuisineContext}. ${dietContext}

Return ONLY a valid JSON array of recipe objects with this exact format, no other text, no markdown:
[{
  "title": "Recipe Name",
  "cuisine": "cuisine type (e.g. Indian, Italian, Chinese, etc.)",
  "prepTime": "e.g. 10 mins",
  "cookTime": "e.g. 25 mins",
  "servings": 2,
  "difficulty": "easy|medium|hard",
  "isVegetarian": true,
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "steps": ["Step 1: ...", "Step 2: ...", ...],
  "tags": ["quick", "vegetarian", etc.],
  "imagePrompt": "professional food photography of [dish name], plated beautifully, warm lighting, appetizing, high resolution"
}]

Rules:
- Prioritize recipes that use the most provided ingredients
- For missing ingredients, include common pantry staples (salt, pepper, oil, water) without mentioning them as missing
- Make recipes practical and cookable by home cooks
- Include cooking tips within the steps
- Each recipe should have at least 4 steps
- isVegetarian must be true if the recipe contains NO meat, fish, or eggs, false otherwise
- Tags should include: difficulty level, meal type (breakfast/lunch/dinner/snack), dietary info (vegetarian/non-vegetarian/vegan), and cuisine type
- Make the imagePrompt a vivid, professional food photography description
- Generate a variety of recipes with different cuisines and difficulty levels`
        },
        {
          role: 'user',
          content: `I have these ingredients available: ${allIngredients.join(', ')}. Please generate recipes ${cuisineContext}. ${dietContext}`
        }
      ],
    })

    const responseText = completion.choices[0]?.message?.content || '[]'

    let recipes
    try {
      // Try to extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        recipes = JSON.parse(jsonMatch[0])
      } else {
        console.error('No JSON array found in response:', responseText.substring(0, 200))
        recipes = []
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', responseText.substring(0, 200))
      recipes = []
    }

    if (!recipes || recipes.length === 0) {
      console.error('No recipes parsed. Raw response length:', responseText.length)
      return NextResponse.json({
        recipes: [],
        warning: 'AI could not generate recipes. Please try again with different ingredients.'
      })
    }

    // Add unique IDs and ensure isVegetarian field exists
    const recipesWithIds = recipes.map((recipe: Record<string, unknown>, index: number) => ({
      ...recipe,
      id: `recipe-${Date.now()}-${index}`,
      isVegetarian: recipe.isVegetarian ?? !String(recipe.ingredients).match(/\b(chicken|mutton|fish|prawn|shrimp|meat|beef|pork|lamb|goat|crab|turkey|keema|minced)\b/i),
    }))

    return NextResponse.json({ recipes: recipesWithIds })
  } catch (error: unknown) {
    console.error('Recipe generation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate recipes'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
