import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { roundId, playerId, bidAmount } = await request.json()
    
    const bid = await prisma.bid.upsert({
      where: {
        roundId_playerId: {
          roundId,
          playerId
        }
      },
      create: {
        roundId,
        playerId,
        bidAmount
      },
      update: {
        bidAmount
      }
    })
    
    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 })
  }
}