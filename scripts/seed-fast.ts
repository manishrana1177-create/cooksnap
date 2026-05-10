// Fast recipe seed script - generates 2000 recipes using AI
// Optimized: 20 recipes per call, 3 parallel calls, better error handling
// Run with: npx tsx scripts/seed-fast.ts

import { PrismaClient } from '@prisma/client'
import ZAI from 'z-ai-web-dev-sdk'

const prisma = new PrismaClient()

const CUISINE_BATCHES = [
  // Indian - highest priority, most recipes
  { cuisine: 'North Indian', count: 100, category: 'main' },
  { cuisine: 'South Indian', count: 80, category: 'breakfast' },
  { cuisine: 'Punjabi', count: 70, category: 'main' },
  { cuisine: 'Mughlai', count: 50, category: 'main' },
  { cuisine: 'Gujarati', count: 50, category: 'main' },
  { cuisine: 'Bengali', count: 50, category: 'main' },
  { cuisine: 'Indian Street Food', count: 60, category: 'snack' },
  { cuisine: 'Indian Desserts', count: 60, category: 'dessert' },
  { cuisine: 'Indian Drinks', count: 30, category: 'drink' },
  { cuisine: 'Rajasthani', count: 35, category: 'main' },
  { cuisine: 'Maharashtrian', count: 40, category: 'main' },
  { cuisine: 'Kerala', count: 35, category: 'main' },
  { cuisine: 'Andhra', count: 30, category: 'main' },
  { cuisine: 'Tamil Nadu', count: 30, category: 'main' },
  { cuisine: 'Hyderabadi', count: 30, category: 'main' },
  { cuisine: 'Kashmiri', count: 20, category: 'main' },
  { cuisine: 'Goan', count: 20, category: 'main' },
  { cuisine: 'Sindhi', count: 15, category: 'main' },
  { cuisine: 'Chettinad', count: 15, category: 'main' },
  { cuisine: 'Awadhi', count: 15, category: 'main' },
  { cuisine: 'Indian Soups and Salads', count: 25, category: 'soup' },
  { cuisine: 'Indian Pickles and Chutneys', count: 25, category: 'side' },
  { cuisine: 'Indian Breads', count: 40, category: 'main' },

  // Asian
  { cuisine: 'Chinese', count: 80, category: 'main' },
  { cuisine: 'Thai', count: 50, category: 'main' },
  { cuisine: 'Japanese', count: 50, category: 'main' },
  { cuisine: 'Korean', count: 40, category: 'main' },
  { cuisine: 'Vietnamese', count: 25, category: 'main' },
  { cuisine: 'Indonesian', count: 20, category: 'main' },
  { cuisine: 'Malaysian', count: 15, category: 'main' },
  { cuisine: 'Filipino', count: 15, category: 'main' },

  // Western
  { cuisine: 'Italian', count: 80, category: 'main' },
  { cuisine: 'Mexican', count: 60, category: 'main' },
  { cuisine: 'American', count: 50, category: 'main' },
  { cuisine: 'French', count: 40, category: 'main' },
  { cuisine: 'Mediterranean', count: 40, category: 'main' },
  { cuisine: 'Spanish', count: 30, category: 'main' },
  { cuisine: 'Greek', count: 25, category: 'main' },
  { cuisine: 'British', count: 20, category: 'main' },
  { cuisine: 'German', count: 15, category: 'main' },
  { cuisine: 'Brazilian', count: 15, category: 'main' },

  // Middle Eastern & African
  { cuisine: 'Middle Eastern', count: 40, category: 'main' },
  { cuisine: 'Turkish', count: 25, category: 'main' },
  { cuisine: 'Lebanese', count: 20, category: 'main' },
  { cuisine: 'Moroccan', count: 15, category: 'main' },
  { cuisine: 'Ethiopian', count: 10, category: 'main' },

  // Special categories
  { cuisine: 'Continental', count: 30, category: 'main' },
  { cuisine: 'Fusion', count: 25, category: 'main' },
  { cuisine: 'Healthy', count: 30, category: 'salad' },
  { cuisine: 'World Desserts', count: 25, category: 'dessert' },
  { cuisine: 'World Soups', count: 20, category: 'soup' },
  { cuisine: 'World Appetizers', count: 20, category: 'appetizer' },
  { cuisine: 'World Breakfast', count: 20, category: 'breakfast' },
]

const RECIPES_PER_CALL = 20
const MAX_PARALLEL = 3

interface RawRecipe {
  title: string
  cuisine: string
  prepTime: string
  cookTime: string
  servings: number
  difficulty: string
  isVegetarian: boolean
  ingredients: string[]
  ingredientNames: string[]
  steps: string[]
  tags: string[]
  imagePrompt: string
  popularity: number
}

async function generateRecipeBatch(zai: any, cuisine: string, count: number, category: string): Promise<RawRecipe[]> {
  const prompt = `Generate exactly ${count} authentic and popular ${cuisine} recipes in the "${category}" category.

Return ONLY a valid JSON array. No markdown, no code fences, no explanation:
[{
  "title": "Recipe Name",
  "cuisine": "${cuisine}",
  "prepTime": "X mins",
  "cookTime": "X mins",
  "servings": 2,
  "difficulty": "easy|medium|hard",
  "isVegetarian": true/false,
  "ingredients": ["2 cups rice", "1 onion chopped", ...],
  "ingredientNames": ["rice", "onion", ...],
  "steps": ["Step 1: ...", "Step 2: ...", ...],
  "tags": ["tag1", "tag2"],
  "imagePrompt": "professional food photography of [dish name], plated beautifully, warm lighting",
  "popularity": 80
}]

RULES:
- ingredientNames: simple names WITHOUT quantities (e.g. "rice", "chicken", "tomato"). Used for pantry matching.
- ingredients: WITH quantities (e.g. "2 cups rice", "500g chicken breast")
- At least 4 steps per recipe
- Mix of vegetarian and non-vegetarian
- Authentic to ${cuisine} cuisine
- popularity: 80-100 for very famous, 50-79 well-known, 20-49 less common
- No duplicate titles
- Use common ingredient names in ingredientNames`

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert chef and recipe database creator. You create authentic, diverse recipes. Always return valid JSON arrays only, no extra text.' },
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
  } catch (error) {
    console.error(`  Error generating ${cuisine}:`, error instanceof Error ? error.message : error)
    return []
  }
}

function extractIngredientNames(ingredients: string[]): string[] {
  return ingredients.map((ing) =>
    ing
      .replace(/^\d+[\d/\s]*\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pounds?|pieces?|cloves?|inches?|slices?|cans?|bunches?|sprigs?|stalks?|heads?|pinch|dash|handful|tablespoon|teaspoon|cup)\s*/i, '')
      .replace(/^[\d/\s]+\s*/, '')
      .replace(/,\s*.*$/, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*(chopped|diced|minced|grated|sliced|crushed|ground|powdered|fresh|dried|boiled|mashed|finely|coarsely|roughly)\s*/gi, '')
      .trim()
      .toLowerCase()
  ).filter((name) => name.length > 1)
}

async function saveRecipes(recipes: RawRecipe[], cuisine: string, category: string): Promise<number> {
  let saved = 0
  for (const recipe of recipes) {
    try {
      if (!recipe.title || !recipe.ingredients?.length || !recipe.steps?.length) continue

      const ingredientNames = recipe.ingredientNames?.length
        ? recipe.ingredientNames
        : extractIngredientNames(recipe.ingredients)

      // Check for duplicate
      const existing = await prisma.recipe.findFirst({ where: { title: recipe.title } })
      if (existing) continue

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
          category: category,
          popularity: recipe.popularity || 50,
          isAIGenerated: true,
        },
      })
      saved++
    } catch (error: any) {
      if (!error.code?.includes('CONSTRAINT')) {
        console.error(`  Save error for ${recipe.title}:`, error.message?.slice(0, 80))
      }
    }
  }
  return saved
}

async function processBatch(
  zai: any,
  batch: { cuisine: string; count: number; category: string },
  batchNum: number,
  totalBatches: number
): Promise<number> {
  let totalSaved = 0
  let remaining = batch.count

  while (remaining > 0) {
    const chunkSize = Math.min(RECIPES_PER_CALL, remaining)
    console.log(`  [${batchNum}/${totalBatches}] Generating ${chunkSize} ${batch.cuisine} recipes... (${remaining} remaining)`)

    const recipes = await generateRecipeBatch(zai, batch.cuisine, chunkSize, batch.category)

    if (recipes.length > 0) {
      const saved = await saveRecipes(recipes, batch.cuisine, batch.category)
      totalSaved += saved
      console.log(`  Generated ${recipes.length}, saved ${saved} (batch total: ${totalSaved})`)
    } else {
      console.log(`  No recipes generated, retrying after delay...`)
      await new Promise((r) => setTimeout(r, 3000))
      const retry = await generateRecipeBatch(zai, batch.cuisine, chunkSize, batch.category)
      if (retry.length > 0) {
        const saved = await saveRecipes(retry, batch.cuisine, batch.category)
        totalSaved += saved
        console.log(`  Retry: saved ${saved} (batch total: ${totalSaved})`)
      } else {
        console.log(`  Retry also failed, skipping remaining ${remaining}`)
        break
      }
    }

    remaining -= chunkSize
    await new Promise((r) => setTimeout(r, 1500))
  }

  return totalSaved
}

async function main() {
  console.log('🍳 Fast Recipe Database Seeding')
  console.log('================================\n')

  const existingCount = await prisma.recipe.count()
  console.log(`Current recipes: ${existingCount}`)

  const TARGET = 2000
  const needed = TARGET - existingCount

  if (needed <= 0) {
    console.log('✅ Already at target! No seeding needed.')
    return
  }

  console.log(`Need to add: ${needed} recipes\n`)

  const zai = await ZAI.create()
  let totalNewSaved = 0

  // Process cuisines sequentially (but parallel within each cuisine's chunks)
  const totalBatches = CUISINE_BATCHES.length

  for (let i = 0; i < CUISINE_BATCHES.length; i++) {
    if (totalNewSaved >= needed) {
      console.log(`\n✅ Reached target of ${needed} new recipes!`)
      break
    }

    const batch = CUISINE_BATCHES[i]
    // Adjust count if we're close to target
    const adjustedCount = Math.min(batch.count, needed - totalNewSaved)
    if (adjustedCount <= 0) break

    const adjustedBatch = { ...batch, count: adjustedCount }

    console.log(`\n[${i + 1}/${totalBatches}] ${batch.cuisine} (${batch.category}) - target: ${adjustedCount}`)

    const saved = await processBatch(zai, adjustedBatch, i + 1, totalBatches)
    totalNewSaved += saved

    const currentTotal = await prisma.recipe.count()
    console.log(`  Progress: ${currentTotal}/${TARGET} total in DB (${totalNewSaved} new this run)`)
  }

  const finalCount = await prisma.recipe.count()
  console.log(`\n🎉 Seeding complete!`)
  console.log(`  Final count: ${finalCount} recipes`)
  console.log(`  Added this run: ${totalNewSaved}`)
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
