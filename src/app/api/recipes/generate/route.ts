import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ingredients, cuisine, pantryIngredients } = body as {
      ingredients: string[]
      cuisine: string
      pantryIngredients?: string[]
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

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a creative chef AI that generates recipes based on available ingredients. Generate 3-5 delicious recipes using the provided ingredients ${cuisineContext}.

Return ONLY a valid JSON array of recipe objects with this exact format, no other text:
[{
  "title": "Recipe Name",
  "cuisine": "cuisine type",
  "prepTime": "e.g. 10 mins",
  "cookTime": "e.g. 25 mins",
  "servings": 2,
  "difficulty": "easy|medium|hard",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "steps": ["Step 1: ...", "Step 2: ...", ...],
  "tags": ["quick", "vegetarian", etc.],
  "imagePrompt": "a short description for generating a food photo of this dish"
}]

Rules:
- Prioritize recipes that use the most provided ingredients
- For missing ingredients, include common pantry staples (salt, pepper, oil, water) without mentioning them as missing
- If a key ingredient is missing for a dish, note it in the ingredients list
- Make recipes practical and cookable by home cooks
- Include cooking tips within the steps
- Each recipe should have at least 4 steps
- Tags should include: difficulty level, meal type (breakfast/lunch/dinner/snack), and dietary info if applicable
- Make the imagePrompt vivid and appetizing`
        },
        {
          role: 'user',
          content: `I have these ingredients available: ${allIngredients.join(', ')}. Please generate recipes ${cuisineContext}.`
        }
      ],
    })

    const responseText = completion.choices[0]?.message?.content || '[]'

    let recipes
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      recipes = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      recipes = []
    }

    // Add unique IDs to each recipe
    const recipesWithIds = recipes.map((recipe: Record<string, unknown>, index: number) => ({
      ...recipe,
      id: `recipe-${Date.now()}-${index}`,
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
