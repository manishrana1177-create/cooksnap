import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    // Use VLM to identify ingredients
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a food ingredient recognition AI. When given an image of a fridge, pantry, or food items, identify ALL visible food ingredients. Return ONLY a JSON array of objects with this exact format, no other text:
[{"name": "ingredient name", "category": "protein|vegetable|fruit|dairy|grain|spice|condiment|beverage|other"}]
Be thorough but only include items you are confident about. Use common ingredient names. If you cannot identify any ingredients, return an empty array [].`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            },
            {
              type: 'text',
              text: 'Identify all the food ingredients visible in this image. List everything you can see.'
            }
          ]
        }
      ],
    })

    const responseText = completion.choices[0]?.message?.content || '[]'

    // Parse the JSON response
    let ingredients
    try {
      // Try to extract JSON from the response (in case there's markdown wrapping)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      ingredients = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      ingredients = []
    }

    // Ensure each ingredient has a confirmed field
    const detectedIngredients = ingredients.map((ing: { name: string; category: string }) => ({
      name: ing.name,
      category: ing.category || 'other',
      confirmed: true,
    }))

    return NextResponse.json({ ingredients: detectedIngredients })
  } catch (error: unknown) {
    console.error('Scan error:', error)
    const message = error instanceof Error ? error.message : 'Failed to scan image'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
