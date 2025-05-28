import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        players: {
          include: {
            player: true
          }
        },
        rounds: {
          include: {
            bids: {
              include: {
                player: true
              }
            }
          },
          orderBy: {
            roundNumber: 'asc'
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json(game)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, currentRound } = await request.json()
    
    const game = await prisma.game.update({
      where: { id: params.id },
      data: {
        status,
        currentRound,
        ...(status === 'IN_PROGRESS' ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { endedAt: new Date() } : {})
      },
      include: {
        players: {
          include: {
            player: true
          }
        }
      }
    })

    return NextResponse.json(game)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}