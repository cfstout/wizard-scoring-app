import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { playerId, seatPosition } = await request.json()
    
    // Update the seat position for this player in this game
    const gamePlayer = await prisma.gamePlayer.updateMany({
      where: {
        gameId: params.id,
        playerId: playerId
      },
      data: {
        seatPosition: seatPosition
      }
    })

    if (gamePlayer.count === 0) {
      return NextResponse.json({ error: 'Player not found in game' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update seat position:', error)
    return NextResponse.json({ error: 'Failed to update seat position' }, { status: 500 })
  }
}