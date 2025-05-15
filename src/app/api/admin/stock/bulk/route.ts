import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const items = await request.json()

    // Validate items
    const validatedItems = items.map((item: any) => ({
      title: item.Title,
      description: item.Description,
      price: parseFloat(item.Price),
      stockCount: parseInt(item['Stock Count']),
      category: item.Category,
      condition: item.Condition,
      lowStockThreshold: parseInt(item['Low Stock Threshold']) || 5,
      images: [], // Default empty array for images
    }))

    // Create items in bulk
    const createdItems = await prisma.stockItem.createMany({
      data: validatedItems,
    })

    return NextResponse.json({
      message: `Successfully imported ${createdItems.count} items`,
    })
  } catch (error) {
    console.error('Error importing stock items:', error)
    return NextResponse.json(
      { error: 'Failed to import stock items' },
      { status: 500 }
    )
  }
} 