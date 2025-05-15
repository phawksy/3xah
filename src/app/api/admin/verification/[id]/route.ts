import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { status } = data

    // Update verification request
    const verification = await prisma.verificationRequest.update({
      where: {
        id: params.id,
      },
      data: {
        status,
      },
    })

    // If approved, update user's verification status
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: {
          id: verification.userId,
        },
        data: {
          isVerified: true,
        },
      })
    }

    return NextResponse.json(verification)
  } catch (error) {
    console.error('Error updating verification request:', error)
    return NextResponse.json(
      { error: 'Failed to update verification request' },
      { status: 500 }
    )
  }
} 