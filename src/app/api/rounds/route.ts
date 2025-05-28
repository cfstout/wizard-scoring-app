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

    // Update game status to IN_PROGRESS if it's the first round
    if (roundNumber === 1) {
      await prisma.game.update({
        where: { id: gameId },
        data: { 
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      })
    }
    
    return NextResponse.json(round, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { roundId, bids, tricksTaken } = await request.json()
    
    // Get the round and game info
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { game: true }
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

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
    
    // Update player total scores for this game
    const gameId = round.gameId
    const allGameBids = await prisma.bid.findMany({
      where: {
        round: {
          gameId: gameId
        }
      },
      include: {
        round: true
      }
    })

    // Calculate total scores for each player
    const playerScores: { [playerId: string]: number } = {}
    allGameBids.forEach(bid => {
      if (bid.score !== null) {
        playerScores[bid.playerId] = (playerScores[bid.playerId] || 0) + bid.score
      }
    })

    // Update game player scores
    for (const [playerId, totalScore] of Object.entries(playerScores)) {
      await prisma.gamePlayer.updateMany({
        where: {
          gameId: gameId,
          playerId: playerId
        },
        data: {
          totalScore: totalScore
        }
      })
    }

    // Check if this was the last round and update game status
    if (round.roundNumber >= round.game.totalRounds) {
      // Calculate final positions
      const finalScores = await prisma.gamePlayer.findMany({
        where: { gameId: gameId },
        orderBy: { totalScore: 'desc' }
      })

      // Update positions
      for (let i = 0; i < finalScores.length; i++) {
        await prisma.gamePlayer.update({
          where: { id: finalScores[i].id },
          data: { position: i + 1 }
        })
      }

      // Mark game as completed
      await prisma.game.update({
        where: { id: gameId },
        data: { 
          status: 'COMPLETED',
          endedAt: new Date()
        }
      })
    } else {
      // Update current round number
      await prisma.game.update({
        where: { id: gameId },
        data: { currentRound: round.roundNumber + 1 }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating round:', error)
    return NextResponse.json({ error: 'Failed to update round' }, { status: 500 })
  }
}