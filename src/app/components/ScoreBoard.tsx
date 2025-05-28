'use client'
import { useState, useEffect } from 'react'

interface Player {
  id: string
  name: string
  totalScore: number
}

interface Game {
  id: string
  status: string
  players: Array<{
    player: Player
    totalScore: number
  }>
  rounds: Array<{
    id: string
    roundNumber: number
    bids: Array<{
      player: Player
      bidAmount: number
      tricksTaken: number
      score: number
    }>
  }>
}

interface ScoreBoardProps {
  gameId: string
}

export default function ScoreBoard({ gameId }: ScoreBoardProps) {
  const [game, setGame] = useState<Game | null>(null)

  useEffect(() => {
    fetchGameDetails()
  }, [gameId])

  const fetchGameDetails = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`)
      const gameData = await response.json()
      setGame(gameData)
    } catch (error) {
      console.error('Failed to fetch game details:', error)
    }
  }

  if (!game) {
    return <div className="p-4">Loading scores...</div>
  }

  const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Score Board</h2>
      
      {/* Current Standings */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Current Standings</h3>
        <div className="space-y-2">
          {sortedPlayers.map((playerGame, index) => (
            <div key={playerGame.player.id} className="flex justify-between items-center p-2 border-b">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">#{index + 1}</span>
                <span className="font-medium">{playerGame.player.name}</span>
                {index === 0 && game.status === 'COMPLETED' && (
                  <span className="text-yellow-500">👑</span>
                )}
              </div>
              <span className="text-lg font-bold">{playerGame.totalScore}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Round History */}
      {game.rounds && game.rounds.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Round History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Round</th>
                  {game.players.map(({ player }) => (
                    <th key={player.id} className="text-center p-2 min-w-[80px]">
                      {player.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {game.rounds.map((round) => (
                  <tr key={round.id} className="border-b">
                    <td className="p-2 font-medium">{round.roundNumber}</td>
                    {game.players.map(({ player }) => {
                      const bid = round.bids.find(b => b.player.id === player.id)
                      return (
                        <td key={player.id} className="text-center p-2">
                          {bid ? (
                            <div>
                              <div className="text-xs text-gray-600">
                                {bid.bidAmount}/{bid.tricksTaken}
                              </div>
                              <div className={`font-bold ${bid.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {bid.score > 0 ? '+' : ''}{bid.score}
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Format: Bid/Taken, Score
          </div>
        </div>
      )}
    </div>
  )
}