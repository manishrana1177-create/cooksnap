/**
 * CookSnap Recipe Seeder v4 - OPTIMIZED
 * - 5 recipes per AI call (fast & reliable)
 * - Robust JSON extraction with balanced-brace parser
 * - Writes progress file for resume capability
 * - Called repeatedly by watchdog script
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, '..', 'db', 'custom.db')}`
}

const prisma = new PrismaClient({ log: [] })

const CUISINE_TARGETS = [
  { cuisine: 'North Indian', target: 200, categories: ['main', 'breakfast', 'snack', 'dessert', 'side'] },
  { cuisine: 'South Indian', target: 135, categories: ['breakfast', 'main', 'snack', 'dessert', 'side'] },
  { cuisine: 'East Indian', target: 70, categories: ['main', 'snack', 'dessert', 'side', 'soup'] },
  { cuisine: 'West Indian', target: 90, categories: ['main', 'snack', 'breakfast', 'dessert', 'side'] },
  { cuisine: 'Indo-Chinese', target: 60, categories: ['main', 'snack', 'appetizer', 'soup', 'side'] },
  { cuisine: 'Street Food', target: 80, categories: ['snack', 'appetizer', 'main', 'side', 'drink'] },
  { cuisine: 'Fast Food & Cafe', target: 60, categories: ['main', 'snack', 'drink', 'side', 'breakfast'] },
  { cuisine: 'Healthy & Fitness', target: 100, categories: ['main', 'salad', 'breakfast', 'snack', 'drink'] },
  { cuisine: 'Vegetarian', target: 175, categories: ['main', 'breakfast', 'snack', 'dessert', 'side', 'salad'] },
  { cuisine: 'Non-Vegetarian', target: 120, categories: ['main', 'appetizer', 'soup', 'snack', 'side'] },
]

const BATCH_SIZE = 5
const PROGRESS_FILE = path.resolve(__dirname, '..', 'seed-progress.json')
const LOG_FILE = path.resolve(__dirname, '..', 'seed-detail.log')

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19)
  const line = `[${ts}] ${msg}`
  console.log(line)
  try { fs.appendFileSync(LOG_FILE, line + '\n') } catch {}
}

function extractIngredientNames(ingredients) {
  return ingredients.map(ing => {
    return ing
      .replace(/^\d+[\d/\s]*\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pounds?|pieces?|cloves?|inches?|slices?|cans?|bunches?|sprigs?|stalks?|heads?|pinch|dash|handful|tablespoons?|teaspoons?|medium|large|small|bowl)\s*/i, '')
      .replace(/^[\d/.\s]+\s*/, '')
      .replace(/,\s*.*$/, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*(chopped|diced|minced|grated|sliced|crushed|ground|powdered|fresh|dried|boiled|mashed|finely|coarsely|thinly|roughly|julienned)\s*/gi, '')
      .trim().toLowerCase()
  }).filter(n => n.length > 1)
}

// Robust parser - extracts recipe objects from potentially malformed JSON
function safeParseRecipes(text) {
  text = text.trim()
  if (text.startsWith('```')) text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')

  // Try full parse first
  const match = text.match(/\[[\s\S]*\]/)
  if (match) {
    let jsonStr = match[0]
    try { return JSON.parse(jsonStr) } catch {}
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')
    try { return JSON.parse(jsonStr) } catch {}
  }

  // Fallback: balanced brace extraction
  const recipes = []
  let depth = 0, start = -1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++ }
    else if (text[i] === '}') {
      depth--
      if (depth === 0 && start >= 0) {
        try {
          let objStr = text.substring(start, i + 1).replace(/,\s*([}\]])/g, '$1')
          const obj = JSON.parse(objStr)
          if (obj.title && (obj.ingredients || obj.ingredientNames)) recipes.push(obj)
        } catch {}
        start = -1
      }
    }
  }
  return recipes
}

async function saveRecipe(recipe, cuisine, category) {
  try {
    if (!recipe.title || !recipe.ingredients || !recipe.steps) return false
    const existing = await prisma.recipe.findFirst({ where: { title: recipe.title } })
    if (existing) return false
    const ingredientNames = recipe.ingredientNames || extractIngredientNames(recipe.ingredients)
    await prisma.recipe.create({
      data: {
        title: recipe.title, cuisine: recipe.cuisine || cuisine,
        cookTime: recipe.cookTime || '30 mins', prepTime: recipe.prepTime || '15 mins',
        servings: recipe.servings || 2, difficulty: recipe.difficulty || 'easy',
        isVegetarian: recipe.isVegetarian ?? true,
        ingredients: JSON.stringify(recipe.ingredients),
        ingredientNames: JSON.stringify(ingredientNames),
        steps: JSON.stringify(recipe.steps),
        tags: JSON.stringify(recipe.tags || []),
        imagePrompt: recipe.imagePrompt || `professional food photography of ${recipe.title}, warm lighting`,
        category: recipe.category || category, popularity: recipe.popularity || 50,
        isAIGenerated: true,
      },
    })
    return true
  } catch { return false }
}

function loadProgress() { try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')) } catch { return {} } }
function saveProgress(p) { try { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)) } catch {} }

async function main() {
  log('🚀 CookSnap Seeder v4')
  let zai
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    zai = await ZAI.create()
    log('✅ z-ai ready')
  } catch (e) { log('❌ z-ai failed: ' + e.message); process.exit(1) }

  const progress = loadProgress()
  const totalBefore = await prisma.recipe.count()
  log(`📊 Current: ${totalBefore} recipes`)

  for (const config of CUISINE_TARGETS) {
    const { cuisine, target, categories } = config
    let currentCount = await prisma.recipe.count({ where: { cuisine } })
    if (currentCount >= target) { log(`✅ ${cuisine}: ${currentCount}/${target}`); continue }

    log(`🍽️  ${cuisine}: ${currentCount}/${target}`)
    let catIdx = progress[cuisine]?.catIdx || 0
    let emptyStreak = 0
    let batchNum = progress[cuisine]?.batchNum || 0

    while (currentCount < target && emptyStreak < 4) {
      const category = categories[catIdx % categories.length]
      catIdx++; batchNum++
      const remaining = target - currentCount
      const batchCount = Math.min(BATCH_SIZE, remaining)
      const isVeg = cuisine === 'Vegetarian'
      const isNonVeg = cuisine === 'Non-Vegetarian'

      const prompt = `Generate ${batchCount} unique ${cuisine} recipes ("${category}").
Return ONLY a JSON array:
[{"title":"Dish","cuisine":"${cuisine}","prepTime":"15 mins","cookTime":"30 mins","servings":2,"difficulty":"easy","isVegetarian":${isVeg?'true':isNonVeg?'false':'true'},"ingredients":["2 cups rice"],"ingredientNames":["rice"],"steps":["Step 1","Step 2"],"tags":["tag1"],"imagePrompt":"food photo of Dish","category":"${category}","popularity":75}]
Rules: ingredientNames=simple names; ingredients=with quantities; ${isVeg?'ALL vegetarian':isNonVeg?'ALL non-veg':'mix veg/non-veg'}; authentic; 4+ steps; no dupes`

      try {
        log(`  #${batchNum} [${currentCount}/${target}] ${category}...`)
        const t0 = Date.now()

        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'Indian chef. ONLY valid JSON arrays. No markdown.' },
            { role: 'user', content: prompt },
          ],
        })
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

        const rawText = completion.choices[0]?.message?.content || ''
        const recipes = safeParseRecipes(rawText)
        log(`  ${recipes.length} parsed (${elapsed}s, ${rawText.length} chars)`)

        let saved = 0
        for (const r of recipes) {
          if (await saveRecipe(r, cuisine, category)) saved++
        }

        currentCount = await prisma.recipe.count({ where: { cuisine } })
        log(`  +${saved} saved → ${currentCount}/${target}`)

        if (saved === 0) emptyStreak++
        else emptyStreak = 0

        progress[cuisine] = { catIdx, currentCount, batchNum }
        saveProgress(progress)
        await sleep(3000)
      } catch (error) {
        log(`  ❌ ${error.message}`)
        emptyStreak++
        await sleep(10000)
      }
    }

    const final = await prisma.recipe.count({ where: { cuisine } })
    log(`  🏁 ${cuisine}: ${final}/${target} (${Math.round(final/target*100)}%)`)
    progress[cuisine] = { catIdx, currentCount: final, batchNum }
    saveProgress(progress)
    await sleep(3000)
  }

  const totalAfter = await prisma.recipe.count()
  const byCuisine = await prisma.recipe.groupBy({ by: ['cuisine'], _count: { cuisine: true }, orderBy: { _count: { cuisine: 'desc' } } })
  log(`📊 ${totalBefore} → ${totalAfter} (+${totalAfter - totalBefore})`)
  byCuisine.forEach(c => log(`  ${c.cuisine}: ${c._count.cuisine}`))
  log('🎉 Done!')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  log('Fatal: ' + e.message)
  await prisma.$disconnect()
  process.exit(1)
})
