/**
 * Direct Recipe Seeding Script for CookSnap
 * Bypasses the Next.js server entirely - uses Prisma + z-ai SDK directly
 * Targets Indian cuisine categories with ~1090 total recipes
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'db', 'custom.db')}`

const prisma = new PrismaClient()

// Recipe targets per cuisine
const CUISINE_TARGETS = [
  { cuisine: 'North Indian', target: 200, categories: ['main', 'breakfast', 'snack', 'dessert', 'side'], vegRatio: 0.5 },
  { cuisine: 'South Indian', target: 135, categories: ['breakfast', 'main', 'snack', 'dessert', 'side'], vegRatio: 0.7 },
  { cuisine: 'East Indian', target: 70, categories: ['main', 'snack', 'dessert', 'side', 'soup'], vegRatio: 0.4 },
  { cuisine: 'West Indian', target: 90, categories: ['main', 'snack', 'breakfast', 'dessert', 'side'], vegRatio: 0.6 },
  { cuisine: 'Indo-Chinese', target: 60, categories: ['main', 'snack', 'appetizer', 'soup', 'side'], vegRatio: 0.4 },
  { cuisine: 'Street Food', target: 80, categories: ['snack', 'appetizer', 'main', 'side', 'drink'], vegRatio: 0.5 },
  { cuisine: 'Fast Food & Cafe', target: 60, categories: ['main', 'snack', 'drink', 'side', 'breakfast'], vegRatio: 0.3 },
  { cuisine: 'Healthy & Fitness', target: 100, categories: ['main', 'salad', 'breakfast', 'snack', 'drink'], vegRatio: 0.6 },
  { cuisine: 'Vegetarian', target: 175, categories: ['main', 'breakfast', 'snack', 'dessert', 'side', 'salad'], vegRatio: 1.0 },
  { cuisine: 'Non-Vegetarian', target: 120, categories: ['main', 'appetizer', 'soup', 'snack', 'side'], vegRatio: 0.0 },
]

const BATCH_SIZE = 10 // recipes per AI call
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // ms

function extractIngredientNames(ingredients) {
  return ingredients.map((ing) => {
    return ing
      .replace(/^\d+[\d/\s]*\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pounds?|pieces?|cloves?|inches?|slices?|cans?|bunches?|sprigs?|stalks?|heads?|pinch|dash|handful)\s*/i, '')
      .replace(/^[\d/\s]+\s*/, '')
      .replace(/,\s*.*$/, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*(chopped|diced|minced|grated|sliced|crushed|ground|powdered|fresh|dried|boiled|mashed|finely|coarsely)\s*/gi, '')
      .trim()
      .toLowerCase()
  }).filter((name) => name.length > 1)
}

async function generateRecipesWithAI(zai, cuisine, category, count, config) {
  const isVegCuisine = cuisine === 'Vegetarian'
  const isNonVegCuisine = cuisine === 'Non-Vegetarian'

  const prompt = `Generate exactly ${count} authentic ${cuisine} recipes in the "${category}" category.

Return ONLY a valid JSON array, no markdown, no code fences, no extra text:
[{
  "title": "Recipe Name",
  "cuisine": "${cuisine}",
  "prepTime": "X mins",
  "cookTime": "X mins",
  "servings": 2,
  "difficulty": "easy|medium|hard",
  "isVegetarian": ${isVegCuisine ? 'true' : isNonVegCuisine ? 'false' : 'true/false'},
  "ingredients": ["2 cups rice", "1 onion chopped", "1 tsp turmeric"],
  "ingredientNames": ["rice", "onion", "turmeric"],
  "steps": ["Step 1: ...", "Step 2: ..."],
  "tags": ["tag1", "tag2"],
  "imagePrompt": "professional food photography of [dish], plated beautifully, warm lighting",
  "category": "${category}",
  "popularity": 50
}]

CRITICAL RULES:
- ingredientNames must be a simple array of common ingredient names WITHOUT quantities (e.g. "rice", "chicken", "tomato", "turmeric"). These are used for matching against user's pantry.
- ingredients must include quantities (e.g. "2 cups rice", "500g chicken")
- Each recipe must have at least 4 steps
- ${isVegCuisine ? 'ALL recipes MUST be vegetarian (isVegetarian: true)' : isNonVegCuisine ? 'ALL recipes MUST be non-vegetarian (isVegetarian: false, must include meat/fish/eggs)' : `Include a good mix of vegetarian (${Math.round(config.vegRatio * 100)}%) and non-vegetarian (${Math.round((1 - config.vegRatio) * 100)}%) recipes`}
- Make recipes authentic to ${cuisine} cuisine - use traditional ingredients and cooking methods
- popularity should be 70-100 for very famous dishes, 40-70 for well-known, 10-40 for less common
- Ensure NO duplicate recipe titles within this batch
- Use real, well-known ${cuisine} dish names
- Include both common and slightly lesser-known dishes for variety
- Do NOT repeat dishes from earlier batches - be creative and diverse`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are an expert chef and recipe database creator specializing in Indian regional cuisines. You create authentic, diverse recipes. Always return valid JSON arrays only.' },
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
    throw new Error('No JSON array found in AI response')
  }

  return JSON.parse(jsonMatch[0])
}

async function saveRecipes(recipes, cuisine, category) {
  let saved = 0
  let skipped = 0
  const errors = []

  for (const recipe of recipes) {
    try {
      if (!recipe.title || !recipe.ingredients || !recipe.steps) {
        skipped++
        continue
      }

      const ingredientNames = recipe.ingredientNames || extractIngredientNames(recipe.ingredients)

      // Check if recipe with same title already exists
      const existing = await prisma.recipe.findFirst({ where: { title: recipe.title } })
      if (existing) {
        skipped++
        continue
      }

      await prisma.recipe.create({
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
    } catch (error) {
      errors.push(`${recipe.title}: ${error.message}`)
    }
  }

  return { saved, skipped, errors }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function seedCuisine(zai, config) {
  const { cuisine, target, categories } = config

  // Get current count for this cuisine
  const currentCount = await prisma.recipe.count({ where: { cuisine } })
  const remaining = target - currentCount

  if (remaining <= 0) {
    console.log(`✅ ${cuisine}: already at ${currentCount}/${target} recipes`)
    return { cuisine, generated: 0, saved: 0, currentCount, target }
  }

  console.log(`\n🍽️  Seeding ${cuisine}: ${currentCount}/${target} (need ${remaining} more)`)

  let totalSaved = 0
  let totalGenerated = 0
  let categoryIndex = 0

  while (totalSaved < remaining) {
    const batchCount = Math.min(BATCH_SIZE, remaining - totalSaved)
    const category = categories[categoryIndex % categories.length]
    categoryIndex++

    let retries = 0
    let success = false

    while (retries < MAX_RETRIES && !success) {
      try {
        console.log(`  📦 Generating ${batchCount} ${cuisine} recipes (${category})... [attempt ${retries + 1}]`)

        const recipes = await generateRecipesWithAI(zai, cuisine, category, batchCount, config)
        totalGenerated += recipes.length

        const { saved, skipped, errors } = await saveRecipes(recipes, cuisine, category)
        totalSaved += saved

        console.log(`  ✅ Saved ${saved}, skipped ${skipped}/${recipes.length} | Total: ${currentCount + totalSaved}/${target}`)

        if (errors.length > 0) {
          console.log(`  ⚠️  Errors: ${errors.slice(0, 2).join('; ')}`)
        }

        success = true

        // Small delay between batches
        await sleep(2000)
      } catch (error) {
        retries++
        console.log(`  ❌ Error: ${error.message} (retry ${retries}/${MAX_RETRIES})`)
        if (retries < MAX_RETRIES) {
          await sleep(RETRY_DELAY)
        }
      }
    }

    if (!success) {
      console.log(`  🛑 ${cuisine}: Failed after ${MAX_RETRIES} retries, moving to next batch`)
      await sleep(RETRY_DELAY)
    }

    // Safety: avoid infinite loop
    if (totalSaved === 0 && totalGenerated > 30) {
      console.log(`  ⚠️  ${cuisine}: Generated ${totalGenerated} but saved 0 — stopping`)
      break
    }
  }

  const finalCount = await prisma.recipe.count({ where: { cuisine } })
  console.log(`  🏁 ${cuisine} done: ${finalCount}/${target} recipes in DB`)

  return { cuisine, generated: totalGenerated, saved: totalSaved, currentCount: finalCount, target }
}

async function main() {
  console.log('🚀 CookSnap Recipe Seeder Starting...')
  console.log(`📊 Target: ~${CUISINE_TARGETS.reduce((s, c) => s + c.target, 0)} total recipes across ${CUISINE_TARGETS.length} cuisines`)

  // Initialize z-ai SDK
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  console.log('✅ z-ai SDK initialized')

  // Check current state
  const totalBefore = await prisma.recipe.count()
  console.log(`📊 Current recipes in DB: ${totalBefore}`)

  const byCuisineBefore = await prisma.recipe.groupBy({
    by: ['cuisine'],
    _count: { cuisine: true },
    orderBy: { _count: { cuisine: 'desc' } },
  })
  console.log('📊 Current breakdown:')
  byCuisineBefore.forEach((c) => console.log(`   ${c.cuisine}: ${c._count.cuisine}`))

  // Seed each cuisine sequentially (avoid overwhelming the AI API)
  const results = []
  for (const config of CUISINE_TARGETS) {
    const result = await seedCuisine(zai, config)
    results.push(result)

    // Delay between cuisines
    await sleep(3000)
  }

  // Final stats
  const totalAfter = await prisma.recipe.count()
  const byCuisineAfter = await prisma.recipe.groupBy({
    by: ['cuisine'],
    _count: { cuisine: true },
    orderBy: { _count: { cuisine: 'desc' } },
  })

  console.log('\n' + '='.repeat(60))
  console.log('📊 FINAL SEEDING REPORT')
  console.log('='.repeat(60))
  console.log(`Total recipes: ${totalBefore} → ${totalAfter} (+${totalAfter - totalBefore})`)
  console.log('\nBreakdown by cuisine:')
  byCuisineAfter.forEach((c) => console.log(`   ${c.cuisine}: ${c._count.cuisine}`))

  console.log('\nResults by cuisine target:')
  results.forEach((r) => {
    const pct = Math.round((r.currentCount / r.target) * 100)
    const status = pct >= 100 ? '✅' : pct >= 80 ? '🟡' : '🔴'
    console.log(`   ${status} ${r.cuisine}: ${r.currentCount}/${r.target} (${pct}%) — saved ${r.saved}`)
  })

  await prisma.$disconnect()
  console.log('\n🎉 Seeding complete!')
}

main().catch(async (error) => {
  console.error('Fatal error:', error)
  await prisma.$disconnect()
  process.exit(1)
})
