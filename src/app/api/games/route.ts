import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateGameRounds } from '@/lib/utils'

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        players: {
          include: {
            player: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(games)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerIds } = await request.json()
    
    const playerCount = playerIds.length
    const totalRounds = calculateGameRounds(playerCount)
    
    const game = await prisma.game.create({
      data: {
        playerCount,
        totalRounds,
        players: {
          create: playerIds.map((playerId: string) => ({
            playerId
          }))
        }
      },
      include: {
        players: {
          include: {
            player: true
          }
        }
      }
    })
    
    return NextResponse.json(game, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}