import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all pantry items
export async function GET() {
  try {
    const items = await db.pantryItem.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items })
  } catch (error: unknown) {
    console.error('Get pantry error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pantry items' },
      { status: 500 }
    )
  }
}

// POST add pantry item(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as { items: { name: string; category: string }[] }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      )
    }

    // Check for duplicates and add only new items
    const existingItems = await db.pantryItem.findMany()
    const existingNames = new Set(existingItems.map((item) => item.name.toLowerCase()))

    const newItems = items.filter(
      (item) => !existingNames.has(item.name.toLowerCase())
    )

    if (newItems.length === 0) {
      return NextResponse.json({ items: existingItems, message: 'All items already in pantry' })
    }

    const created = await db.pantryItem.createMany({
      data: newItems.map((item) => ({
        name: item.name,
        category: item.category || 'other',
      })),
    })

    const allItems = await db.pantryItem.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items: allItems, created: created.count })
  } catch (error: unknown) {
    console.error('Add pantry error:', error)
    return NextResponse.json(
      { error: 'Failed to add pantry items' },
      { status: 500 }
    )
  }
}

// DELETE a pantry item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'No item ID provided' },
        { status: 400 }
      )
    }

    await db.pantryItem.delete({ where: { id } })

    const items = await db.pantryItem.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items })
  } catch (error: unknown) {
    console.error('Delete pantry error:', error)
    return NextResponse.json(
      { error: 'Failed to delete pantry item' },
      { status: 500 }
    )
  }
}
