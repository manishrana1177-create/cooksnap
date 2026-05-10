import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 120 // Allow up to 120 seconds for AI image generation

export async function POST(request: NextRequest) {
  let imagePath: string | null = null

  try {
    const body = await request.json()
    const { prompt, recipeId } = body as { prompt: string; recipeId: string }

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
    }

    // Generate a unique filename
    const filename = `recipe_${recipeId || randomUUID()}.png`
    imagePath = join(process.cwd(), 'public', 'recipe-images', filename)

    // Check if image already exists
    if (existsSync(imagePath)) {
      return NextResponse.json({ imageUrl: `/recipe-images/${filename}` })
    }

    // Use z-ai-generate CLI to create the image
    const command = `z-ai-generate -p ${JSON.stringify(prompt)} -o ${JSON.stringify(imagePath)} -s 1344x768 2>/dev/null`

    try {
      execSync(command, { timeout: 120000 })
    } catch (execError) {
      console.error('Image generation error:', execError)
      return NextResponse.json({ imageUrl: null, error: 'Image generation failed' })
    }

    // Verify the image was created
    if (existsSync(imagePath)) {
      return NextResponse.json({ imageUrl: `/recipe-images/${filename}` })
    } else {
      return NextResponse.json({ imageUrl: null, error: 'Image file not created' })
    }
  } catch (error: unknown) {
    console.error('Recipe image error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
