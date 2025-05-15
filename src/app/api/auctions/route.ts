import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const querySchema = z.object({
  sort: z.enum(['ending-soon', 'recently-listed', 'price-asc', 'price-desc', 'most-bids']).optional(),
  category: z.string().array().optional(),
  condition: z.string().array().optional(),
  grader: z.string().array().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = Object.fromEntries(searchParams.entries())

    // Parse and validate query parameters
    const validatedQuery = querySchema.parse({
      ...query,
      category: searchParams.getAll('category'),
      condition: searchParams.getAll('condition'),
      grader: searchParams.getAll('grader'),
    })

    // Build the Prisma query
    const where: any = {}

    if (validatedQuery.category?.length) {
      where.categoryId = { in: validatedQuery.category }
    }

    if (validatedQuery.condition?.length) {
      where.condition = { in: validatedQuery.condition }
    }

    if (validatedQuery.grader?.length) {
      where.grader = { in: validatedQuery.grader }
    }

    if (validatedQuery.minPrice) {
      where.currentPrice = {
        ...where.currentPrice,
        gte: parseFloat(validatedQuery.minPrice),
      }
    }

    if (validatedQuery.maxPrice) {
      where.currentPrice = {
        ...where.currentPrice,
        lte: parseFloat(validatedQuery.maxPrice),
      }
    }

    // Determine sort order
    let orderBy: any = { endTime: 'asc' } // default sort by ending soon

    switch (validatedQuery.sort) {
      case 'recently-listed':
        orderBy = { createdAt: 'desc' }
        break
      case 'price-asc':
        orderBy = { currentPrice: 'asc' }
        break
      case 'price-desc':
        orderBy = { currentPrice: 'desc' }
        break
      case 'most-bids':
        orderBy = { bids: { _count: 'desc' } }
        break
    }

    // Fetch auctions with related data
    const auctions = await prisma.listing.findMany({
      where: {
        ...where,
        status: 'ACTIVE',
      },
      orderBy,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
      take: 24, // Limit results per page
    })

    // Transform the data for the response
    const transformedAuctions = auctions.map((auction) => ({
      id: auction.id,
      title: auction.title,
      imageUrl: auction.images[0], // Assuming the first image is the main one
      currentPrice: auction.currentPrice,
      startingPrice: auction.startingPrice,
      endTime: auction.endTime,
      bids: auction._count.bids,
      seller: {
        name: auction.seller.name,
        image: auction.seller.image,
      },
      condition: auction.condition,
      grade: auction.grade,
      grader: auction.grader,
    }))

    return NextResponse.json(transformedAuctions)
  } catch (error) {
    console.error('Error fetching auctions:', error)
    return NextResponse.json(
      { message: 'Error fetching auctions' },
      { status: 500 }
    )
  }
} 