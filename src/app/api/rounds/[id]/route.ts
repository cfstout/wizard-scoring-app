import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const round = await prisma.round.findUnique({
      where: { id: params.id },
      include: {
        bids: {
          include: {
            player: true
          }
        }
      }
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    return NextResponse.json(round)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch round' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, trumpSuit } = await request.json()
    
    const round = await prisma.round.update({
      where: { id: params.id },
      data: {
        status,
        ...(trumpSuit !== undefined ? { trumpSuit } : {})
      }
    })

    return NextResponse.json(round)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update round' }, { status: 500 })
  }
}