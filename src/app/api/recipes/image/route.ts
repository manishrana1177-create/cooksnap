import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { uploadFile, getFileUrl } from '@/lib/storage'

export async function POST(request: NextRequest) {
  let localImagePath: string | null = null

  try {
    const body = await request.json()
    const { prompt, recipeId } = body as { prompt: string; recipeId: string }

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
    }

    // Generate a unique filename
    const filename = `recipe_${recipeId || randomUUID()}.png`
    const storagePath = `recipe-images/${filename}`

    // Generate image to a local temp path first (CLI requires local filesystem)
    const tempDir = join('/tmp', 'cooksnap-images')
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }
    localImagePath = join(tempDir, filename)

    // Use z-ai-generate CLI to create the image
    const command = `z-ai-generate -p ${JSON.stringify(prompt)} -o ${JSON.stringify(localImagePath)} -s 1344x768 2>/dev/null`

    try {
      execSync(command, { timeout: 120000 })
    } catch (execError) {
      console.error('Image generation error:', execError)
      return NextResponse.json({ imageUrl: null, error: 'Image generation failed' })
    }

    // Check if image was created locally
    if (!existsSync(localImagePath)) {
      return NextResponse.json({ imageUrl: null, error: 'Image file not created' })
    }

    // Read the generated image and upload to storage (Supabase or local)
    const imageBuffer = readFileSync(localImagePath)
    const imageUrl = await uploadFile(imageBuffer, storagePath, 'image/png')

    // Clean up temp file
    try {
      if (localImagePath) unlinkSync(localImagePath)
    } catch { /* ignore */ }

    return NextResponse.json({ imageUrl })
  } catch (error: unknown) {
    // Clean up temp file on error
    try {
      if (localImagePath) unlinkSync(localImagePath)
    } catch { /* ignore */ }

    console.error('Recipe image error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Helper to clean up temp files
function unlinkSync(path: string) {
  try {
    const { unlinkSync: unlink } = require('fs')
    if (existsSync(path)) unlink(path)
  } catch { /* ignore */ }
}
