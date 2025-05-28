import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        gameParticipations: {
          include: {
            game: {
              where: {
                status: 'COMPLETED'
              }
            }
          }
        }
      }
    })

    const playerStats = players.map(player => {
      const completedGames = player.gameParticipations.filter(
        gp => gp.game.status === 'COMPLETED'
      )
      
      const wins = completedGames.filter(gp => gp.position === 1).length
      const totalGames = completedGames.length
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0
      const averageScore = totalGames > 0 
        ? completedGames.reduce((sum, gp) => sum + gp.totalScore, 0) / totalGames 
        : 0

      return {
        ...player,
        stats: {
          totalGames,
          wins,
          winRate: Math.round(winRate * 100) / 100,
          averageScore: Math.round(averageScore * 100) / 100
        }
      }
    })

    return NextResponse.json(playerStats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 })
  }
}
