const { PrismaClient } = require('@prisma/client')
const ZAI = require('z-ai-web-dev-sdk').default

const prisma = new PrismaClient({ log: [] })

async function main() {
  let total = await prisma.recipe.count()
  console.log(`[${new Date().toISOString()}] Starting. Current: ${total}`)
  if (total >= 2000) { console.log('Done!'); return }

  const zai = await ZAI.create()
  console.log('ZAI ready')

  // Get cuisines that need more recipes
  const cuisineCounts = await prisma.recipe.groupBy({
    by: ['cuisine'], _count: { cuisine: true }
  })
  const counts = {}
  cuisineCounts.forEach(c => { counts[c.cuisine] = c._count.cuisine })

  const targets = {
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

  const categories = {
    'South Indian': 'breakfast', 'Indian Street Food': 'snack',
    'Indian Desserts': 'dessert', 'Indian Drinks': 'drink',
    'Indian Soups and Salads': 'soup', 'Indian Pickles and Chutneys': 'side',
    'Healthy': 'salad', 'World Desserts': 'dessert', 'World Soups': 'soup',
    'World Appetizers': 'appetizer',
  }

  for (const [cuisine, target] of Object.entries(targets)) {
    if (total >= 2000) break
    const existing = counts[cuisine] || 0
    const needed = Math.min(target - existing, 2000 - total)
    if (needed <= 0) continue

    const category = categories[cuisine] || 'main'
    console.log(`\n${cuisine}: ${existing}/${target} (need ${needed}) | Total: ${total}`)

    let gen = 0
    while (gen < needed && total < 2000) {
      const batch = Math.min(5, needed - gen)
      try {
        const c = await zai.chat.completions.create({
          messages: [{
            role: 'user',
            content: `Generate ${batch} authentic ${cuisine} ${category} recipes as JSON array only: [{"title":"...","cuisine":"${cuisine}","prepTime":"10 mins","cookTime":"20 mins","servings":2,"difficulty":"easy","isVegetarian":true,"ingredients":["2 cups rice","1 tsp salt"],"ingredientNames":["rice","salt"],"steps":["Step 1: ..."],"tags":["tag1"],"imagePrompt":"food photo","popularity":60}] Mix veg/nonveg. ingredientNames=simple names only.`
          }]
        })
        let text = c.choices[0]?.message?.content || '[]'
        text = text.trim().replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
        const m = text.match(/\[[\s\S]*\]/)
        if (!m) { console.log('  No JSON'); continue }
        const recipes = JSON.parse(m[0])
        let saved = 0
        for (const r of recipes) {
          if (!r.title || !r.ingredients || !r.steps) continue
          try {
            const dup = await prisma.recipe.findFirst({ where: { title: r.title } })
            if (dup) continue
            const names = r.ingredientNames || r.ingredients.map(i => i.replace(/^[\d/\s]*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pieces?|cloves?|pinch|dash)\s*/i,'').replace(/,.*/,'').replace(/\(.*\)/,'').replace(/chopped|diced|minced|grated|sliced|fresh|dried/gi,'').trim().toLowerCase()).filter(n => n.length > 1)
            await prisma.recipe.create({ data: {
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
            }})
            saved++; total++
          } catch (e) { /* skip */ }
        }
        gen += recipes.length
        console.log(`  +${saved} (total: ${total})`)
      } catch (e) {
        console.log(`  Error: ${e.message?.substring(0, 50)}`)
        await new Promise(r => setTimeout(r, 5000))
      }
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  console.log(`\nDone! Total: ${await prisma.recipe.count()}`)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) }).finally(() => prisma.$disconnect())
