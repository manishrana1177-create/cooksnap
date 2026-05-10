/**
 * Fast Recipe Seeder - Generates large batches via AI and saves directly to Prisma
 * Key optimization: Generate 20 recipes per AI call, save to DB, repeat
 * Runs as a persistent process that keeps going until targets are met
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, '..', 'db', 'custom.db')}`
}

const prisma = new PrismaClient({ log: [] })

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

const BATCH_SIZE = 20
const PROGRESS_FILE = path.resolve(__dirname, '..', 'seed-progress.json')

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function extractIngredientNames(ingredients) {
  return ingredients.map((ing) => {
    return ing
      .replace(/^\d+[\d/\s]*\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pounds?|pieces?|cloves?|inches?|slices?|cans?|bunches?|sprigs?|stalks?|heads?|pinch|dash|handful|tablespoons?|teaspoons?|medium|large|small|bowl)\s*/i, '')
      .replace(/^[\d/.\s]+\s*/, '')
      .replace(/,\s*.*$/, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*(chopped|diced|minced|grated|sliced|crushed|ground|powdered|fresh|dried|boiled|mashed|finely|coarsely|thinly|roughly|julienned)\s*/gi, '')
      .trim()
      .toLowerCase()
  }).filter(n => n.length > 1)
}

async function generateBatch(zai, cuisine, category, count, config) {
  const isVeg = cuisine === 'Vegetarian'
  const isNonVeg = cuisine === 'Non-Vegetarian'

  const prompt = `Generate exactly ${count} unique, authentic ${cuisine} recipes in the "${category}" category.

IMPORTANT: Return ONLY a JSON array. No markdown, no code fences, no explanation.
Format:
[{
  "title": "Dish Name",
  "cuisine": "${cuisine}",
  "prepTime": "15 mins",
  "cookTime": "30 mins",
  "servings": 2,
  "difficulty": "easy",
  "isVegetarian": ${isVeg ? 'true' : isNonVeg ? 'false' : 'true'},
  "ingredients": ["2 cups basmati rice", "1 large onion sliced", "1 tsp cumin seeds"],
  "ingredientNames": ["basmati rice", "onion", "cumin seeds"],
  "steps": ["Heat oil in a pan and add cumin seeds", "Add sliced onions and sauté until golden"],
  "tags": ["quick", "everyday"],
  "imagePrompt": "professional food photography of Dish Name, plated beautifully",
  "category": "${category}",
  "popularity": 75
}]

Rules:
- ingredientNames: simple names only (no quantities) - "rice" not "2 cups rice"
- ingredients: with quantities - "2 cups rice" not "rice"
- At least 4 steps per recipe
- ${isVeg ? 'ALL must be vegetarian' : isNonVeg ? 'ALL must contain meat/fish/eggs' : `About ${Math.round(config.vegRatio*100)}% vegetarian`}
- Authentic ${cuisine} dish names
- popularity: 70-100 for famous, 40-70 for common, 10-40 for rare
- No duplicates within this batch
- Be diverse: include curries, dry dishes, rice dishes, breads, snacks as appropriate for ${category}`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are an expert Indian chef. Create authentic recipes. Return ONLY valid JSON arrays, no extra text.' },
      { role: 'user', content: prompt },
    ],
  })

  let text = completion.choices[0]?.message?.content || '[]'
  text = text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array in response')
  return JSON.parse(match[0])
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
          imagePrompt: recipe.imagePrompt || `professional food photography of ${recipe.title}, warm lighting`,
          category: recipe.category || category,
          popularity: recipe.popularity || 50,
          isAIGenerated: true,
        },
      })
      saved++
    } catch (e) { /* skip */ }
  }
  return { saved, skipped }
}

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')) } catch { return {} }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

async function main() {
  console.log('🚀 CookSnap Fast Recipe Seeder')
  const totalTarget = CUISINE_TARGETS.reduce((s, c) => s + c.target, 0)
  console.log(`📊 Target: ~${totalTarget} recipes`)

  let zai
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    zai = await ZAI.create()
    console.log('✅ z-ai SDK ready')
  } catch (e) {
    console.error('❌ z-ai failed:', e.message)
    process.exit(1)
  }

  const progress = loadProgress()

  for (const config of CUISINE_TARGETS) {
    const { cuisine, target, categories, vegRatio } = config
    let currentCount = await prisma.recipe.count({ where: { cuisine } })

    if (currentCount >= target) {
      console.log(`✅ ${cuisine}: ${currentCount}/${target}`)
      continue
    }

    console.log(`\n🍽️  ${cuisine}: ${currentCount}/${target}`)
    let catIdx = progress[cuisine]?.catIdx || 0
    let emptyStreak = 0

    while (currentCount < target && emptyStreak < 5) {
      const category = categories[catIdx % categories.length]
      catIdx++
      const remaining = target - currentCount
      const batchCount = Math.min(BATCH_SIZE, remaining)

      try {
        process.stdout.write(`  [${currentCount}/${target}] ${category} (${batchCount})...`)
        const recipes = await generateBatch(zai, cuisine, category, batchCount, config)
        const { saved, skipped } = await saveRecipes(recipes, cuisine, category)

        currentCount = await prisma.recipe.count({ where: { cuisine } })
        console.log(` +${saved} saved (${skipped} dup) → ${currentCount}/${target}`)

        if (saved === 0) emptyStreak++
        else emptyStreak = 0

        progress[cuisine] = { catIdx, lastSaved: saved, currentCount }
        saveProgress(progress)

        await sleep(3000)
      } catch (error) {
        console.log(` ❌ ${error.message}`)
        emptyStreak++
        await sleep(10000)
      }
    }

    const final = await prisma.recipe.count({ where: { cuisine } })
    const pct = Math.round((final / target) * 100)
    console.log(`  🏁 ${cuisine}: ${final}/${target} (${pct}%)`)
    progress[cuisine] = { catIdx, currentCount: final, done: final >= target }
    saveProgress(progress)
    await sleep(5000)
  }

  // Final report
  const total = await prisma.recipe.count()
  const byCuisine = await prisma.recipe.groupBy({ by: ['cuisine'], _count: { cuisine: true }, orderBy: { _count: { cuisine: 'desc' } } })
  console.log(`\n📊 Total: ${total} recipes`)
  byCuisine.forEach(c => console.log(`   ${c.cuisine}: ${c._count.cuisine}`))
  console.log('🎉 Done!')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Fatal:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})
