import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all favorite recipes
export async function GET() {
  try {
    const favorites = await db.favoriteRecipe.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const parsed = favorites.map((fav) => ({
      ...fav,
      ingredients: JSON.parse(fav.ingredients),
      steps: JSON.parse(fav.steps),
      tags: JSON.parse(fav.tags),
    }))

    return NextResponse.json({ favorites: parsed })
  } catch (error: unknown) {
    console.error('Get favorites error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

// POST add a favorite recipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipe } = body as {
      recipe: {
        title: string
        cuisine: string
        cookTime: string
        prepTime: string
        servings: number
        difficulty: string
        isVegetarian: boolean
        ingredients: string[]
        steps: string[]
        tags: string[]
        imagePrompt: string
        imageUrl?: string
      }
    }

    if (!recipe) {
      return NextResponse.json(
        { error: 'No recipe provided' },
        { status: 400 }
      )
    }

    // Check if already favorited (by title)
    const existing = await db.favoriteRecipe.findFirst({
      where: { title: recipe.title },
    })

    if (existing) {
      return NextResponse.json({ error: 'Recipe already in favorites' }, { status: 409 })
    }

    const favorite = await db.favoriteRecipe.create({
      data: {
        title: recipe.title,
        cuisine: recipe.cuisine || 'global',
        cookTime: recipe.cookTime || '',
        prepTime: recipe.prepTime || '',
        servings: recipe.servings || 2,
        difficulty: recipe.difficulty || 'easy',
        isVegetarian: recipe.isVegetarian ?? false,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
        tags: JSON.stringify(recipe.tags || []),
        imagePrompt: recipe.imagePrompt || '',
        imageUrl: recipe.imageUrl || '',
      },
    })

    return NextResponse.json({ favorite })
  } catch (error: unknown) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

// DELETE a favorite recipe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'No recipe ID provided' },
        { status: 400 }
      )
    }

    await db.favoriteRecipe.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Delete favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    )
  }
}
