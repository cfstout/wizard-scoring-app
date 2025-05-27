import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateScore } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { gameId, roundNumber, cardsPerPlayer, trumpSuit } = await request.json()
    
    const round = await prisma.round.create({
      data: {
        gameId,
        roundNumber,
        cardsPerPlayer,
        trumpSuit
      }
    })
    
    return NextResponse.json(round, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { roundId, bids, tricksTaken } = await request.json()
    
    // Update bids with tricks taken and calculate scores
    const updatePromises = bids.map(async (bid: any) => {
      const tricks = tricksTaken[bid.playerId] || 0
      const score = calculateScore(bid.bidAmount, tricks)
      
      return prisma.bid.upsert({
        where: {
          roundId_playerId: {
            roundId,
            playerId: bid.playerId
          }
        },
        create: {
          roundId,
          playerId: bid.playerId,
          bidAmount: bid.bidAmount,
          tricksTaken: tricks,
          score
        },
        update: {
          tricksTaken: tricks,
          score
        }
      })
    })
    
    await Promise.all(updatePromises)
    
    // Update round status
    await prisma.round.update({
      where: { id: roundId },
      data: { status: 'COMPLETED' }
    })
    
    // Update player total scores
    const updatedBids = await prisma.bid.findMany({
      where: { roundId },
      include: { player: true }
    })
    
    for (const bid of updatedBids) {
      const playerTotalScore = await prisma.bid.aggregate({
        where: {
          playerId: bid.playerId,
          round: {
            gameId: (await prisma.round.findUnique({
              where: { id: roundId },
              select: { gameId: true }
            }))?.gameId
          }
        },
        _sum: {
          score: true
        }
      })
      
      await prisma.gamePlayer.updateMany({
        where: {
          playerId: bid.playerId,
          gameId: (await prisma.round.findUnique({
            where: { id: roundId },
            select: { gameId: true }
          }))?.gameId
        },
        data: {
          totalScore: playerTotalScore._sum.score || 0
        }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update round' }, { status: 500 })
  }
}