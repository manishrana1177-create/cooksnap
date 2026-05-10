const { PrismaClient } = require('@prisma/client')
const ZAI = require('z-ai-web-dev-sdk').default

const prisma = new PrismaClient({ log: ['error'] })

const CUISINES = [
  ['North Indian','main'],['South Indian','breakfast'],['Mughlai','main'],
  ['Punjabi','main'],['Gujarati','main'],['Bengali','main'],
  ['Rajasthani','main'],['Maharashtrian','main'],['Kerala','main'],
  ['Indian Street Food','snack'],['Indian Desserts','dessert'],
  ['Indian Drinks','drink'],['Indian Soups and Salads','soup'],
  ['Indian Pickles and Chutneys','side'],
  ['Andhra','main'],['Tamil Nadu','main'],['Hyderabadi','main'],
  ['Kashmiri','main'],['Goan','main'],
  ['Chinese','main'],['Thai','main'],['Japanese','main'],['Korean','main'],
  ['Vietnamese','main'],['Indonesian','main'],
  ['Italian','main'],['Mexican','main'],['American','main'],
  ['French','main'],['Mediterranean','main'],['Spanish','main'],['Greek','main'],
  ['Middle Eastern','main'],['Turkish','main'],['Lebanese','main'],['Moroccan','main'],
  ['Continental','main'],['Fusion','main'],
  ['Healthy','salad'],['World Desserts','dessert'],['World Soups','soup'],['World Appetizers','appetizer'],
]

// Target recipes per cuisine
const TARGETS = {
  'North Indian': 120, 'South Indian': 100, 'Mughlai': 60, 'Punjabi': 50,
  'Gujarati': 50, 'Bengali': 50, 'Chinese': 100, 'Italian': 100,
  'Thai': 60, 'Japanese': 60, 'Korean': 50, 'Mexican': 70, 'American': 60,
  'French': 50, 'Mediterranean': 50, 'Spanish': 40, 'Greek': 30,
  'Middle Eastern': 50, 'Indian Street Food': 70, 'Indian Desserts': 70,
  'Maharashtrian': 40, 'Rajasthani': 40, 'Kerala': 40,
  'Indian Drinks': 40, 'Indian Soups and Salads': 40,
  'Indian Pickles and Chutneys': 40, 'Andhra': 30, 'Tamil Nadu': 30,
  'Hyderabadi': 30, 'Kashmiri': 20, 'Goan': 20, 'Vietnamese': 30,
  'Indonesian': 25, 'Turkish': 30, 'Lebanese': 25, 'Moroccan': 20,
  'Continental': 40, 'Fusion': 30, 'Healthy': 40, 'World Desserts': 30,
  'World Soups': 25, 'World Appetizers': 25,
}

function extractNames(ingredients) {
  return ingredients.map(i => i
    .replace(/^\d+[\d/\s]*\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pounds?|pieces?|cloves?|inches?|slices?|cans?|bunches?|sprigs?|stalks?|heads?|pinch|dash|handful)\s*/i, '')
    .replace(/^[\d/\s]+\s*/, '')
    .replace(/,\s*.*$/, '').replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*(chopped|diced|minced|grated|sliced|crushed|ground|powdered|fresh|dried|boiled|mashed|finely|coarsely)\s*/gi, '')
    .trim().toLowerCase()
  ).filter(n => n.length > 1)
}

async function main() {
  console.log('🍳 Direct recipe seeder starting...')
  const current = await prisma.recipe.count()
  console.log(`Current: ${current} recipes`)
  if (current >= 2000) { console.log('✅ Already at 2000+!'); return }

  const zai = await ZAI.create()
  let total = current

  for (const [cuisine, category] of CUISINES) {
    if (total >= 2000) break

    // Count how many this cuisine already has
    const existing = await prisma.recipe.count({ where: { cuisine: { contains: cuisine } } })
    const target = TARGETS[cuisine] || 30
    const needed = Math.min(target - existing, 2000 - total)
    if (needed <= 0) continue

    console.log(`\n${cuisine}: ${existing}/${target} (need ${needed}) | Total: ${total}`)

    let generated = 0
    while (generated < needed && total < 2000) {
      const batchSize = Math.min(5, needed - generated)
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are a chef. Return ONLY a JSON array of recipes. No markdown.' },
            { role: 'user', content: `Generate ${batchSize} authentic ${cuisine} ${category} recipes. JSON array: [{"title":"...","cuisine":"${cuisine}","prepTime":"X mins","cookTime":"X mins","servings":2,"difficulty":"easy|medium|hard","isVegetarian":true/false,"ingredients":["2 cups rice","1 onion"],"ingredientNames":["rice","onion"],"steps":["Step 1: ...","Step 2: ..."],"tags":["tag1"],"imagePrompt":"food photo of [dish]","popularity":50}]. Mix veg/non-veg. ingredientNames=names only, no quantities.` },
          ],
        })

        let text = completion.choices[0]?.message?.content || '[]'
        text = text.trim().replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
        const match = text.match(/\[[\s\S]*\]/)
        if (!match) { console.log('  No JSON'); continue }

        const recipes = JSON.parse(match[0])
        let saved = 0
        for (const r of recipes) {
          if (!r.title || !r.ingredients || !r.steps) continue
          try {
            const dup = await prisma.recipe.findFirst({ where: { title: r.title } })
            if (dup) continue
            const names = r.ingredientNames || extractNames(r.ingredients)
            await prisma.recipe.create({
              data: {
                title: r.title, cuisine: r.cuisine || cuisine,
                cookTime: r.cookTime || '30 mins', prepTime: r.prepTime || '15 mins',
                servings: r.servings || 2, difficulty: r.difficulty || 'easy',
                isVegetarian: r.isVegetarian ?? true,
                ingredients: JSON.stringify(r.ingredients),
                ingredientNames: JSON.stringify(names),
                steps: JSON.stringify(r.steps),
                tags: JSON.stringify(r.tags || []),
                imagePrompt: r.imagePrompt || `food photo of ${r.title}`,
                category: r.category || category,
                popularity: r.popularity || 50, isAIGenerated: true,
              },
            })
            saved++; total++
          } catch (e) { /* skip */ }
        }
        generated += recipes.length
        process.stdout.write(` +${saved}(${total})`)
      } catch (e) {
        process.stdout.write(' !')
        await new Promise(r => setTimeout(r, 3000))
      }
      await new Promise(r => setTimeout(r, 2000))
    }
    console.log('')
  }
  console.log(`\n🎉 Done! Total: ${await prisma.recipe.count()}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
