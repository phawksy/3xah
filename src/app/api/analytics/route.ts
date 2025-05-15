import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get sales data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sales = await prisma.listing.findMany({
      where: {
        status: 'SOLD',
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        updatedAt: true,
        currentPrice: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
    })

    // Get category distribution
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: {
            listings: true,
          },
        },
      },
    })

    // Get top sellers
    const topSellers = await prisma.user.findMany({
      where: {
        role: 'SELLER',
      },
      select: {
        name: true,
        listings: {
          where: {
            status: 'SOLD',
          },
          select: {
            currentPrice: true,
          },
        },
      },
      take: 5,
    })

    // Get recent activity
    const recentActivity = await prisma.listing.findMany({
      where: {
        OR: [
          { status: 'SOLD' },
          { status: 'ACTIVE' },
        ],
      },
      select: {
        title: true,
        status: true,
        updatedAt: true,
        seller: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    })

    // Format the data
    const formattedSales = sales.map(sale => ({
      date: sale.updatedAt.toISOString().split('T')[0],
      amount: Number(sale.currentPrice),
    }))

    const formattedCategories = categories.map(category => ({
      name: category.name,
      value: category._count.listings,
    }))

    const formattedTopSellers = topSellers.map(seller => ({
      name: seller.name || 'Anonymous',
      sales: seller.listings.reduce((sum, listing) => sum + Number(listing.currentPrice), 0),
    }))

    const formattedActivity = recentActivity.map(activity => ({
      type: activity.status,
      description: `${activity.seller.name} ${activity.status === 'SOLD' ? 'sold' : 'listed'} "${activity.title}"`,
      timestamp: activity.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      sales: formattedSales,
      categories: formattedCategories,
      topSellers: formattedTopSellers,
      recentActivity: formattedActivity,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
} 