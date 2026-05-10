// Recipe seed script - generates recipes using AI and saves to database
// Run with: npx tsx scripts/seed-recipes.ts

import { PrismaClient } from '@prisma/client'
import ZAI from 'z-ai-web-dev-sdk'

const prisma = new PrismaClient()

// Cuisine categories with target counts - totals ~2000 recipes
const CUISINE_BATCHES = [
  // Indian cuisines - highest priority
  { cuisine: 'North Indian', count: 120, category: 'main' },
  { cuisine: 'South Indian', count: 100, category: 'breakfast' },
  { cuisine: 'Mughlai', count: 60, category: 'main' },
  { cuisine: 'Indian Street Food', count: 70, category: 'snack' },
  { cuisine: 'Indian Desserts', count: 70, category: 'dessert' },
  { cuisine: 'Indian Drinks', count: 40, category: 'drink' },
  { cuisine: 'Indian Soups and Salads', count: 40, category: 'soup' },
  { cuisine: 'Indian Pickles and Chutneys', count: 40, category: 'side' },
  { cuisine: 'Gujarati', count: 50, category: 'main' },
  { cuisine: 'Bengali', count: 50, category: 'main' },
  { cuisine: 'Punjabi', count: 50, category: 'main' },
  { cuisine: 'Rajasthani', count: 40, category: 'main' },
  { cuisine: 'Maharashtrian', count: 40, category: 'main' },
  { cuisine: 'Kerala', count: 40, category: 'main' },
  { cuisine: 'Andhra', count: 30, category: 'main' },
  { cuisine: 'Tamil Nadu', count: 30, category: 'main' },
  { cuisine: 'Hyderabadi', count: 30, category: 'main' },
  { cuisine: 'Kashmiri', count: 20, category: 'main' },
  { cuisine: 'Goan', count: 20, category: 'main' },
  { cuisine: 'Sindhi', count: 15, category: 'main' },
  { cuisine: 'Awadhi', count: 15, category: 'main' },
  { cuisine: 'Chettinad', count: 15, category: 'main' },

  // Asian cuisines
  { cuisine: 'Chinese', count: 100, category: 'main' },
  { cuisine: 'Thai', count: 60, category: 'main' },
  { cuisine: 'Japanese', count: 60, category: 'main' },
  { cuisine: 'Korean', count: 50, category: 'main' },
  { cuisine: 'Vietnamese', count: 30, category: 'main' },
  { cuisine: 'Indonesian', count: 25, category: 'main' },
  { cuisine: 'Malaysian', count: 20, category: 'main' },
  { cuisine: 'Filipino', count: 20, category: 'main' },
  { cuisine: 'Singaporean', count: 15, category: 'main' },

  // Western cuisines
  { cuisine: 'Italian', count: 100, category: 'main' },
  { cuisine: 'Mexican', count: 70, category: 'main' },
  { cuisine: 'American', count: 60, category: 'main' },
  { cuisine: 'French', count: 50, category: 'main' },
  { cuisine: 'Mediterranean', count: 50, category: 'main' },
  { cuisine: 'Spanish', count: 40, category: 'main' },
  { cuisine: 'Greek', count: 30, category: 'main' },
  { cuisine: 'British', count: 25, category: 'main' },
  { cuisine: 'German', count: 20, category: 'main' },
  { cuisine: 'Brazilian', count: 15, category: 'main' },

  // Middle Eastern & African
  { cuisine: 'Middle Eastern', count: 50, category: 'main' },
  { cuisine: 'Turkish', count: 30, category: 'main' },
  { cuisine: 'Lebanese', count: 25, category: 'main' },
  { cuisine: 'Moroccan', count: 20, category: 'main' },
  { cuisine: 'Ethiopian', count: 15, category: 'main' },

  // Special categories
  { cuisine: 'Continental', count: 40, category: 'main' },
  { cuisine: 'Fusion', count: 30, category: 'main' },
  { cuisine: 'Healthy', count: 40, category: 'salad' },
  { cuisine: 'World Desserts', count: 30, category: 'dessert' },
  { cuisine: 'World Soups', count: 25, category: 'soup' },
  { cuisine: 'World Appetizers', count: 25, category: 'appetizer' },
]

const BATCH_SIZE = 10 // Generate 10 recipes per AI call

async function generateRecipeBatch(zai: any, cuisine: string, count: number, category: string): Promise<any[]> {
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
  "ingredients": ["2 cups rice", "1 onion chopped", "1 tsp turmeric", ...],
  "ingredientNames": ["rice", "onion", "turmeric", ...],
  "steps": ["Step 1: ...", "Step 2: ...", ...],
  "tags": ["tag1", "tag2", ...],
  "imagePrompt": "professional food photography of [dish], plated beautifully, warm lighting",
  "popularity": 50
}]

CRITICAL RULES:
- ingredientNames must be a simple array of common ingredient names WITHOUT quantities (e.g. "rice", "chicken", "tomato", "turmeric"). These are used for matching against user's pantry.
- ingredients must include quantities (e.g. "2 cups rice", "500g chicken")
- Each recipe must have at least 4 steps
- Include a good mix of vegetarian and non-vegetarian recipes
- Make recipes authentic to ${cuisine} cuisine
- popularity should be 70-100 for very famous dishes, 40-70 for well-known, 10-40 for less common
- Ensure NO duplicate recipe titles within this batch
- Use common ingredient names in ingredientNames (e.g. "potato" not "solanum tuberosum")`

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert chef and recipe database creator. You create authentic, diverse recipes from world cuisines. Always return valid JSON arrays only.' },
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
      console.error(`  No JSON array found in response for ${cuisine}`)
      return []
    }

    const recipes = JSON.parse(jsonMatch[0])
    return recipes
  } catch (error) {
    console.error(`  Error generating ${cuisine} recipes:`, error)
    return []
  }
}

async function saveRecipeBatch(recipes: any[], cuisine: string, category: string): Promise<number> {
  let saved = 0
  for (const recipe of recipes) {
    try {
      // Validate required fields
      if (!recipe.title || !recipe.ingredients || !recipe.steps) {
        console.error(`  Skipping invalid recipe: ${recipe.title || 'untitled'}`)
        continue
      }

      // Ensure ingredientNames exists
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
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        // Duplicate title, skip
      } else {
        console.error(`  Error saving recipe ${recipe.title}:`, error.message)
      }
    }
  }
  return saved
}

// Extract simple ingredient names from ingredient strings with quantities
function extractIngredientNames(ingredients: string[]): string[] {
  return ingredients.map((ing: string) => {
    // Remove quantities like "2 cups", "500g", "1 tsp", "1/2 tbsp", etc.
    return ing
      .replace(/^\d+[\d/\s]*\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pounds?|pieces?|cloves?|inches?|slices?|cans?|bunches?|sprigs?|stalks?|heads?|pinch|dash|handful)\s*/i, '')
      .replace(/^[\d/\s]+\s*/, '')
      .replace(/,\s*.*$/, '') // Remove everything after comma
      .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical notes
      .replace(/\s*(chopped|diced|minced|grated|sliced|crushed|ground|powdered|fresh|dried|boiled|mashed|finely|coarsely)\s*/gi, '')
      .trim()
      .toLowerCase()
  }).filter((name: string) => name.length > 1)
}

async function main() {
  console.log('🍳 Starting recipe database seeding...\n')

  const existingCount = await prisma.recipe.count()
  console.log(`Current recipes in database: ${existingCount}\n`)

  if (existingCount >= 2000) {
    console.log('✅ Database already has 2000+ recipes. Skipping seed.')
    return
  }

  const zai = await ZAI.create()

  let totalSaved = existingCount
  let totalAttempted = 0
  let batchIndex = 0

  for (const batch of CUISINE_BATCHES) {
    if (totalSaved >= 2000) {
      console.log('\n✅ Reached 2000 recipes target!')
      break
    }

    batchIndex++
    const remaining = 2000 - totalSaved
    const adjustedCount = Math.min(batch.count, remaining)
    if (adjustedCount <= 0) break

    console.log(`\n[${batchIndex}/${CUISINE_BATCHES.length}] Generating ${adjustedCount} ${batch.cuisine} ${batch.category} recipes...`)
    console.log(`  Progress: ${totalSaved}/2000 recipes saved`)

    // Split into sub-batches of BATCH_SIZE
    let subBatchStart = 0
    while (subBatchStart < adjustedCount) {
      const subBatchSize = Math.min(BATCH_SIZE, adjustedCount - subBatchStart)
      totalAttempted += subBatchSize

      const recipes = await generateRecipeBatch(zai, batch.cuisine, subBatchSize, batch.category)

      if (recipes.length > 0) {
        const saved = await saveRecipeBatch(recipes, batch.cuisine, batch.category)
        totalSaved += saved
        console.log(`  Generated ${recipes.length}, saved ${saved} recipes (total: ${totalSaved})`)
      } else {
        console.log(`  No recipes generated for this batch, retrying...`)
        // Retry once
        await new Promise((r) => setTimeout(r, 2000))
        const retryRecipes = await generateRecipeBatch(zai, batch.cuisine, subBatchSize, batch.category)
        if (retryRecipes.length > 0) {
          const saved = await saveRecipeBatch(retryRecipes, batch.cuisine, batch.category)
          totalSaved += saved
          console.log(`  Retry: Generated ${retryRecipes.length}, saved ${saved} recipes (total: ${totalSaved})`)
        } else {
          console.log(`  Retry also failed, moving to next batch`)
        }
      }

      subBatchStart += subBatchSize

      // Small delay between API calls to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  const finalCount = await prisma.recipe.count()
  console.log(`\n🎉 Seeding complete!`)
  console.log(`  Total recipes in database: ${finalCount}`)
  console.log(`  Total attempted: ${totalAttempted}`)
  console.log(`  Total saved: ${totalSaved - existingCount} new recipes`)
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
