/**
 * ONE-SHOT seeder v2 - generates ONE batch of 5 recipes and exits
 * - Fetches existing titles to avoid duplicates
 * - Uses diverse prompts encouraging less common dishes
 * - Called repeatedly by watchdog loop
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

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

const DIVERSE_PROMPTS = [
  'Include regional specialties and lesser-known traditional dishes',
  'Focus on home-style cooking, not restaurant dishes',
  'Include dishes from specific sub-regions and communities',
  'Include festive and celebration dishes',
  'Include everyday comfort food and family recipes',
  'Include dishes using seasonal and local ingredients',
  'Include traditional dishes that are fading from modern menus',
  'Focus on dishes with unique cooking techniques',
  'Include dishes from specific festivals and occasions',
  'Include heirloom recipes passed down through generations',
]

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

function safeParseRecipes(text) {
  text = text.trim()
  if (text.startsWith('```')) text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  const match = text.match(/\[[\s\S]*\]/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
    try { return JSON.parse(match[0].replace(/,\s*([}\]])/g, '$1')) } catch {}
  }
  const recipes = []
  let depth = 0, start = -1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++ }
    else if (text[i] === '}') {
      depth--
      if (depth === 0 && start >= 0) {
        try {
          const obj = JSON.parse(text.substring(start, i + 1).replace(/,\s*([}\]])/g, '$1'))
          if (obj.title && (obj.ingredients || obj.ingredientNames)) recipes.push(obj)
        } catch {}
        start = -1
      }
    }
  }
  return recipes
}

async function main() {
  let targetConfig = null
  let currentCount = 0
  for (const config of CUISINE_TARGETS) {
    const count = await prisma.recipe.count({ where: { cuisine: config.cuisine } })
    if (count < config.target) {
      targetConfig = config
      currentCount = count
      break
    }
  }

  if (!targetConfig) {
    const total = await prisma.recipe.count()
    console.log(`DONE: All targets reached! Total: ${total}`)
    await prisma.$disconnect()
    process.exit(2)
  }

  const { cuisine, target, categories } = targetConfig
  const batchNum = Math.floor(currentCount / 5)
  const category = categories[batchNum % categories.length]
  const diversityHint = DIVERSE_PROMPTS[batchNum % DIVERSE_PROMPTS.length]
  const isVeg = cuisine === 'Vegetarian'
  const isNonVeg = cuisine === 'Non-Vegetarian'

  // Get existing titles to avoid duplicates
  const existingRecipes = await prisma.recipe.findMany({
    where: { cuisine },
    select: { title: true },
    take: 50,
    orderBy: { createdAt: 'desc' },
  })
  const existingTitles = existingRecipes.map(r => r.title).join(', ')

  console.log(`${cuisine} [${currentCount}/${target}] ${category}`)

  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()

  const prompt = `Generate 5 unique ${cuisine} recipes ("${category}" category).
${diversityHint}.

EXISTING RECIPES TO AVOID (do NOT generate these): ${existingTitles}

Return ONLY a JSON array:
[{"title":"Dish Name","cuisine":"${cuisine}","prepTime":"15 mins","cookTime":"30 mins","servings":2,"difficulty":"easy","isVegetarian":${isVeg?'true':isNonVeg?'false':'true'},"ingredients":["2 cups basmati rice","1 tsp turmeric powder"],"ingredientNames":["basmati rice","turmeric powder"],"steps":["Step 1: detail","Step 2: detail","Step 3: detail","Step 4: detail"],"tags":["tag1","tag2"],"imagePrompt":"professional food photography of Dish Name","category":"${category}","popularity":75}]

Rules:
- ingredientNames: simple names WITHOUT quantities
- ingredients: WITH quantities
- ${isVeg?'ALL must be vegetarian':isNonVeg?'ALL must be non-vegetarian (contain meat/fish/eggs)':'Mix of vegetarian and non-vegetarian'}
- Authentic ${cuisine} dishes
- At least 4 detailed steps per recipe
- NO duplicates with the existing recipes listed above
- Be creative - generate LESS COMMON dishes, not the same popular ones everyone knows`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'Expert Indian chef specializing in regional cuisines. Return ONLY valid JSON arrays. No markdown fences. No extra text.' },
      { role: 'user', content: prompt },
    ],
  })

  const rawText = completion.choices[0]?.message?.content || ''
  const recipes = safeParseRecipes(rawText)

  let saved = 0
  for (const r of recipes) {
    try {
      if (!r.title || !r.ingredients || !r.steps) continue
      const existing = await prisma.recipe.findFirst({ where: { title: r.title } })
      if (existing) { console.log(`  skip: ${r.title}`); continue }
      const ingredientNames = r.ingredientNames || extractIngredientNames(r.ingredients)
      // Coerce types - AI sometimes returns numbers instead of strings
      const cookTime = typeof r.cookTime === 'number' ? `${r.cookTime} mins` : (r.cookTime || '30 mins')
      const prepTime = typeof r.prepTime === 'number' ? `${r.prepTime} mins` : (r.prepTime || '15 mins')
      const servings = typeof r.servings === 'string' ? parseInt(r.servings) || 2 : (r.servings || 2)
      const popularity = typeof r.popularity === 'string' ? parseInt(r.popularity) || 50 : (r.popularity || 50)
      await prisma.recipe.create({
        data: {
          title: r.title, cuisine: r.cuisine || cuisine,
          cookTime, prepTime,
          servings, difficulty: r.difficulty || 'easy',
          isVegetarian: r.isVegetarian ?? true,
          ingredients: JSON.stringify(r.ingredients),
          ingredientNames: JSON.stringify(ingredientNames),
          steps: JSON.stringify(r.steps),
          tags: JSON.stringify(r.tags || []),
          imagePrompt: r.imagePrompt || `professional food photography of ${r.title}`,
          category: r.category || category, popularity,
          isAIGenerated: true,
        },
      })
      console.log(`  +${r.title}`)
      saved++
    } catch (e) { console.log(`  err: ${e.message}`) }
  }

  const newCount = await prisma.recipe.count({ where: { cuisine } })
  console.log(`→ ${newCount}/${target} (+${saved})`)
  await prisma.$disconnect()
  process.exit(0)
}

main().catch(async (e) => {
  console.error('Error:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})
