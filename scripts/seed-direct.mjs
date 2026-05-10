// Standalone seed script - uses z-ai SDK and Prisma directly
// Run: node scripts/seed-direct.mjs

import { PrismaClient } from '@prisma/client'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const ZAI = require('z-ai-web-dev-sdk').default

const prisma = new PrismaClient({ log: ['error'] })

const BATCHES = [
  { cuisine: 'North Indian', count: 120, category: 'main' },
  { cuisine: 'South Indian', count: 100, category: 'breakfast' },
  { cuisine: 'Mughlai', count: 60, category: 'main' },
  { cuisine: 'Indian Street Food', count: 70, category: 'snack' },
  { cuisine: 'Indian Desserts', count: 70, category: 'dessert' },
  { cuisine: 'Punjabi', count: 50, category: 'main' },
  { cuisine: 'Gujarati', count: 50, category: 'main' },
  { cuisine: 'Bengali', count: 50, category: 'main' },
  { cuisine: 'Maharashtrian', count: 40, category: 'main' },
  { cuisine: 'Rajasthani', count: 40, category: 'main' },
  { cuisine: 'Kerala', count: 40, category: 'main' },
  { cuisine: 'Indian Drinks', count: 40, category: 'drink' },
  { cuisine: 'Indian Soups and Salads', count: 40, category: 'soup' },
  { cuisine: 'Indian Pickles and Chutneys', count: 40, category: 'side' },
  { cuisine: 'Andhra', count: 30, category: 'main' },
  { cuisine: 'Tamil Nadu', count: 30, category: 'main' },
  { cuisine: 'Hyderabadi', count: 30, category: 'main' },
  { cuisine: 'Chinese', count: 100, category: 'main' },
  { cuisine: 'Thai', count: 60, category: 'main' },
  { cuisine: 'Japanese', count: 60, category: 'main' },
  { cuisine: 'Korean', count: 50, category: 'main' },
  { cuisine: 'Italian', count: 100, category: 'main' },
  { cuisine: 'Mexican', count: 70, category: 'main' },
  { cuisine: 'American', count: 60, category: 'main' },
  { cuisine: 'French', count: 50, category: 'main' },
  { cuisine: 'Mediterranean', count: 50, category: 'main' },
  { cuisine: 'Spanish', count: 40, category: 'main' },
  { cuisine: 'Greek', count: 30, category: 'main' },
  { cuisine: 'Middle Eastern', count: 50, category: 'main' },
  { cuisine: 'Turkish', count: 30, category: 'main' },
  { cuisine: 'Lebanese', count: 25, category: 'main' },
  { cuisine: 'Moroccan', count: 20, category: 'main' },
  { cuisine: 'Vietnamese', count: 30, category: 'main' },
  { cuisine: 'Indonesian', count: 25, category: 'main' },
  { cuisine: 'British', count: 25, category: 'main' },
  { cuisine: 'Kashmiri', count: 20, category: 'main' },
  { cuisine: 'Goan', count: 20, category: 'main' },
  { cuisine: 'Continental', count: 40, category: 'main' },
  { cuisine: 'Fusion', count: 30, category: 'main' },
  { cuisine: 'Healthy', count: 40, category: 'salad' },
  { cuisine: 'World Desserts', count: 30, category: 'dessert' },
  { cuisine: 'World Soups', count: 25, category: 'soup' },
  { cuisine: 'World Appetizers', count: 25, category: 'appetizer' },
]

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

async function generateBatch(zai, cuisine, count, category) {
  const prompt = `Generate exactly ${count} authentic ${cuisine} recipes in the "${category}" category.

Return ONLY a valid JSON array, no markdown, no code fences, no extra text:
[{
  "title": "Recipe Name",
  "cuisine": "${cuisine}",
  "prepTime": "X mins",
  "cookTime": "X mins",
  "servings": 2,
  "difficulty": "easy|medium|hard",
  "isVegetarian": true/false,
  "ingredients": ["2 cups rice", "1 onion chopped", "1 tsp turmeric"],
  "ingredientNames": ["rice", "onion", "turmeric"],
  "steps": ["Step 1: ...", "Step 2: ..."],
  "tags": ["tag1", "tag2"],
  "imagePrompt": "professional food photography of [dish], plated beautifully, warm lighting",
  "popularity": 50
}]

RULES:
- ingredientNames: simple names WITHOUT quantities (for pantry matching)
- ingredients: WITH quantities (for cooking)
- At least 4 steps each
- Mix of veg and non-veg
- popularity: 70-100 famous, 40-70 well-known, 10-40 less common
- No duplicates in this batch`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are an expert chef and recipe database creator. Always return valid JSON arrays only.' },
      { role: 'user', content: prompt },
    ],
  })

  let text = completion.choices[0]?.message?.content || '[]'
  text = text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  return JSON.parse(match[0])
}

async function saveRecipes(recipes, cuisine, category) {
  let saved = 0
  for (const recipe of recipes) {
    try {
      if (!recipe.title || !recipe.ingredients || !recipe.steps) continue
      const existing = await prisma.recipe.findFirst({ where: { title: recipe.title } })
      if (existing) continue
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
          imagePrompt: recipe.imagePrompt || `professional food photography of ${recipe.title}`,
          category: recipe.category || category,
          popularity: recipe.popularity || 50,
          isAIGenerated: true,
        },
      })
      saved++
    } catch (e) {
      // skip errors
    }
  }
  return saved
}

async function main() {
  console.log('🍳 Starting recipe database seeding (direct mode)...\n')

  let existing = await prisma.recipe.count()
  console.log(`Current: ${existing} recipes`)

  if (existing >= 2000) {
    console.log('✅ Already have 2000+ recipes!')
    return
  }

  const zai = await ZAI.create()
  let totalSaved = existing

  for (let b = 0; b < BATCHES.length; b++) {
    if (totalSaved >= 2000) {
      console.log('\n✅ Reached 2000 recipes!')
      break
    }

    const { cuisine, count, category } = BATCHES[b]
    const remaining = Math.min(count, 2000 - totalSaved)
    console.log(`\n[${b + 1}/${BATCHES.length}] ${cuisine} (${remaining} recipes) | Total: ${totalSaved}/2000`)

    // Generate in sub-batches of 5
    let generated = 0
    while (generated < remaining && totalSaved < 2000) {
      const batchSize = Math.min(5, remaining - generated)
      try {
        const recipes = await generateBatch(zai, cuisine, batchSize, category)
        if (recipes.length > 0) {
          const saved = await saveRecipes(recipes, cuisine, category)
          totalSaved += saved
          generated += recipes.length
          process.stdout.write(`  +${saved} (total: ${totalSaved}) `)
        } else {
          process.stdout.write(' ✗ ')
        }
      } catch (e) {
        process.stdout.write(' ! ')
        await new Promise((r) => setTimeout(r, 3000))
      }
      // Small delay
      await new Promise((r) => setTimeout(r, 1500))
    }
    console.log('')
  }

  const final = await prisma.recipe.count()
  console.log(`\n🎉 Done! Total recipes: ${final}`)
}

main()
  .catch((e) => { console.error('Fatal:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
