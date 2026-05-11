import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { execSync } from 'child_process'

export async function POST(request: NextRequest) {
  let filePath: string | null = null
  let outputPath: string | null = null

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Convert image to buffer and save to disk temporarily for CLI processing
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = imageFile.type?.split('/')[1] || 'jpg'
    const filename = `scan_${randomUUID()}.${ext}`
    filePath = join('/tmp', filename)
    writeFileSync(filePath, buffer)

    // Output path for the vision result
    const outputFilename = `vision_${randomUUID()}.json`
    outputPath = join('/tmp', outputFilename)

    // Use the z-ai vision CLI tool which supports local file paths
    const prompt = `Identify ALL visible food ingredients in this image. Return ONLY a JSON array like this, no other text, no markdown: [{"name":"ingredient name","category":"protein|vegetable|fruit|dairy|grain|spice|condiment|beverage|other"}] Be thorough but only include items you are confident about. Use common ingredient names. If you cannot identify any food ingredients, return an empty array [].`

    const command = `z-ai vision -p ${JSON.stringify(prompt)} -i ${JSON.stringify(filePath)} -o ${JSON.stringify(outputPath)} 2>/dev/null`

    try {
      execSync(command, { timeout: 60000 })
    } catch (execError) {
      console.error('Vision CLI error:', execError)
      // Clean up and return empty results - user can add manually
      try { if (filePath && existsSync(filePath)) unlinkSync(filePath) } catch { /* ignore */ }
      try { if (outputPath && existsSync(outputPath)) unlinkSync(outputPath) } catch { /* ignore */ }
      return NextResponse.json({
        ingredients: [],
        warning: 'Could not analyze image. Please add ingredients manually below.'
      })
    }

    // Read and parse the CLI output
    let ingredients: { name: string; category: string }[] = []
    try {
      if (outputPath && existsSync(outputPath)) {
        const resultText = readFileSync(outputPath, 'utf-8')
        const result = JSON.parse(resultText)
        const responseText = result.choices?.[0]?.message?.content || '[]'
        const jsonMatch = responseText.match(/\[[\s\S]*\]/)
        ingredients = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      }
    } catch (parseError) {
      console.error('Parse error:', parseError)
      ingredients = []
    }

    // Clean up temp files
    try { if (filePath && existsSync(filePath)) unlinkSync(filePath) } catch { /* ignore */ }
    try { if (outputPath && existsSync(outputPath)) unlinkSync(outputPath) } catch { /* ignore */ }

    // Ensure each ingredient has a confirmed field
    const detectedIngredients = ingredients.map((ing: { name: string; category: string }) => ({
      name: ing.name,
      category: ing.category || 'other',
      confirmed: true,
    }))

    return NextResponse.json({ ingredients: detectedIngredients })
  } catch (error: unknown) {
    // Clean up on error too
    try { if (filePath && existsSync(filePath)) unlinkSync(filePath) } catch { /* ignore */ }
    try { if (outputPath && existsSync(outputPath)) unlinkSync(outputPath) } catch { /* ignore */ }

    console.error('Scan error:', error)
    const message = error instanceof Error ? error.message : 'Failed to scan image'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
