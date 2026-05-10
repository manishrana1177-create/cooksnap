/**
 * Simplified Direct Recipe Seeder - No Next.js server needed
 * Uses Prisma + z-ai-web-dev-sdk directly
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, '..', 'db', 'custom.db')}`
}

const prisma = new PrismaClient({ log: ['error'] })

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

const BATCH_SIZE = 8
const MAX_RETRIES = 3

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateBatch(zai, cuisine, category, count, config) {
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
- ingredientNames: simple ingredient names WITHOUT quantities (e.g. "rice", "chicken", "tomato")
- ingredients: include quantities (e.g. "2 cups rice", "500g chicken")
- Each recipe must have at least 4 steps
- ${isVegCuisine ? 'ALL recipes MUST be vegetarian' : isNonVegCuisine ? 'ALL recipes MUST be non-vegetarian (must include meat/fish/eggs)' : `Mix ${Math.round(config.vegRatio * 100)}% vegetarian`}
- Authentic ${cuisine} dishes with real names
- popularity: 70-100 famous, 40-70 well-known, 10-40 less common
- NO duplicate titles in this batch`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are an expert chef specializing in Indian regional cuisines. Return valid JSON arrays only.' },
      { role: 'user', content: prompt },
    ],
  })

  const responseText = completion.choices[0]?.message?.content || '[]'
  let cleaned = responseText.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array in AI response')
  return JSON.parse(jsonMatch[0])
}

async function saveRecipes(recipes, cuisine, category) {
  let saved = 0, skipped = 0
  for (const recipe of recipes) {
    try {
      if (!recipe.title || !recipe.ingredients || !recipe.steps) { skipped++; continue }
      const existing = await prisma.recipe.findFirst({ where: { title: recipe.title } })
      if (existing) { skipped++; continue }
      const ingredientNames = recipe.ingredientNames || extractIngredientNames(recipe.ingredients)
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
    } catch (e) {
      // Skip duplicates and other errors
    }
  }
  return { saved, skipped }
}

async function main() {
  console.log('🚀 CookSnap Direct Recipe Seeder')
  const totalTarget = CUISINE_TARGETS.reduce((s, c) => s + c.target, 0)
  console.log(`📊 Target: ~${totalTarget} recipes across ${CUISINE_TARGETS.length} cuisines`)

  // Initialize z-ai SDK
  let zai
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    zai = await ZAI.create()
    console.log('✅ z-ai SDK initialized')
  } catch (e) {
    console.error('❌ Failed to init z-ai SDK:', e.message)
    process.exit(1)
  }

  const totalBefore = await prisma.recipe.count()
  console.log(`📊 Current recipes: ${totalBefore}`)

  for (const config of CUISINE_TARGETS) {
    const { cuisine, target, categories, vegRatio } = config
    const currentCount = await prisma.recipe.count({ where: { cuisine } })
    const remaining = target - currentCount

    if (remaining <= 0) {
      console.log(`✅ ${cuisine}: ${currentCount}/${target} — done`)
      continue
    }

    console.log(`\n🍽️  ${cuisine}: ${currentCount}/${target} (need ${remaining} more)`)
    let totalSavedThisCuisine = 0
    let catIndex = 0
    let emptyBatches = 0

    while (totalSavedThisCuisine < remaining) {
      const category = categories[catIndex % categories.length]
      catIndex++
      const batchCount = Math.min(BATCH_SIZE, remaining - totalSavedThisCuisine)

      let retries = 0
      let result = null

      while (retries < MAX_RETRIES && !result) {
        try {
          process.stdout.write(`  📦 ${cuisine} (${category}): generating ${batchCount}...`)
          const recipes = await generateBatch(zai, cuisine, category, batchCount, config)
          const { saved, skipped } = await saveRecipes(recipes, cuisine, category)

          if (saved === 0 && skipped > 0) {
            console.log(` 0 saved, ${skipped} skipped (duplicates)`)
            emptyBatches++
          } else {
            console.log(` ${saved} saved, ${skipped} skipped`)
            totalSavedThisCuisine += saved
            emptyBatches = 0
          }

          result = { saved, skipped }
          await sleep(3000) // Delay between batches
        } catch (error) {
          retries++
          console.log(` ❌ ${error.message} (retry ${retries}/${MAX_RETRIES})`)
          if (retries < MAX_RETRIES) {
            await sleep(10000)
          }
        }
      }

      // If 3 consecutive empty batches, move on
      if (emptyBatches >= 3) {
        console.log(`  ⚠️  ${cuisine}: 3 empty batches, moving to next cuisine`)
        break
      }

      // If all retries failed, wait longer
      if (!result) {
        console.log(`  🛑 ${cuisine}: batch failed after ${MAX_RETRIES} retries`)
        await sleep(15000)
      }
    }

    const finalCount = await prisma.recipe.count({ where: { cuisine } })
    const pct = Math.round((finalCount / target) * 100)
    console.log(`  🏁 ${cuisine}: ${finalCount}/${target} (${pct}%)`)

    // Delay between cuisines
    await sleep(5000)
  }

  // Final report
  const totalAfter = await prisma.recipe.count()
  const byCuisine = await prisma.recipe.groupBy({ by: ['cuisine'], _count: { cuisine: true }, orderBy: { _count: { cuisine: 'desc' } } })

  console.log('\n' + '='.repeat(50))
  console.log(`📊 FINAL: ${totalBefore} → ${totalAfter} recipes (+${totalAfter - totalBefore})`)
  byCuisine.forEach(c => console.log(`   ${c.cuisine}: ${c._count.cuisine}`))
  console.log('🎉 Done!')

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Fatal:', e)
  await prisma.$disconnect()
  process.exit(1)
})
