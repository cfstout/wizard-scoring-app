'use client'
import { useState, useEffect } from 'react'

interface Player {
  id: string
  name: string
}

interface GamePlayer {
  player: Player
  totalScore: number
  position: number
  seatPosition: number
}

interface Bid {
  id: string
  playerId: string
  player: Player
  bidAmount: number
  tricksTaken: number | null
  score: number | null
}

interface Round {
  id: string
  roundNumber: number
  cardsPerPlayer: number
  trumpSuit?: string
  bids: Bid[]
}

interface Game {
  id: string
  totalRounds: number
  playerCount: number
  status: string
  players: GamePlayer[]
  rounds: Round[]
  startedAt: string
  endedAt: string
}

interface GameCompletionModalProps {
  gameId: string
  onNewGame: () => void
  onViewScores: () => void
}

export default function GameCompletionModal({ gameId, onNewGame, onViewScores }: GameCompletionModalProps) {
  const [game, setGame] = useState<Game | null>(null)
  const [showStats, setShowStats] = useState(false)

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
    return <div className="p-4">Loading game results...</div>
  }

  // Sort players by final position
  const finalStandings = [...game.players].sort((a, b) => a.position - b.position)
  const winner = finalStandings[0]

  // Calculate game statistics
  const gameDuration = game.startedAt && game.endedAt 
    ? Math.round((new Date(game.endedAt).getTime() - new Date(game.startedAt).getTime()) / (1000 * 60))
    : null

  // Calculate some interesting stats
  const playerStats = finalStandings.map(gamePlayer => {
    const playerBids = game.rounds.flatMap(round => 
      round.bids.filter(bid => bid.playerId === gamePlayer.player.id)
    )
    
    const correctBids = playerBids.filter(bid => bid.bidAmount === bid.tricksTaken).length
    const totalBids = playerBids.length
    const accuracyRate = totalBids > 0 ? Math.round((correctBids / totalBids) * 100) : 0
    
    const highestSingleRound = Math.max(...playerBids.map(bid => bid.score || 0))
    const lowestSingleRound = Math.min(...playerBids.map(bid => bid.score || 0))

    return {
      ...gamePlayer,
      correctBids,
      totalBids,
      accuracyRate,
      highestSingleRound,
      lowestSingleRound
    }
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-t-lg text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">Game Complete!</h1>
          <div className="text-yellow-100">
            <div className="text-xl font-semibold">🏆 {winner.player.name} Wins!</div>
            <div className="text-sm mt-1">Final Score: {winner.totalScore} points</div>
          </div>
        </div>

        {/* Final Standings */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Final Standings</h2>
          <div className="space-y-3">
            {finalStandings.map((gamePlayer, index) => (
              <div 
                key={gamePlayer.player.id} 
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  index === 0 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : index === 1 
                      ? 'border-gray-400 bg-gray-50'
                      : index === 2
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`text-2xl font-bold flex items-center justify-center w-10 h-10 rounded-full ${
                    index === 0 
                      ? 'bg-yellow-400 text-white' 
                      : index === 1 
                        ? 'bg-gray-400 text-white'
                        : index === 2
                          ? 'bg-orange-400 text-white'
                          : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{gamePlayer.player.name}</div>
                    <div className="text-sm text-gray-600">Seat {gamePlayer.seatPosition}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{gamePlayer.totalScore}</div>
                  <div className="text-sm text-gray-600">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Summary */}
        <div className="px-6 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Game Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Rounds Played:</span>
                <span className="font-medium ml-1">{game.totalRounds}</span>
              </div>
              <div>
                <span className="text-blue-700">Players:</span>
                <span className="font-medium ml-1">{game.playerCount}</span>
              </div>
              {gameDuration && (
                <div>
                  <span className="text-blue-700">Duration:</span>
                  <span className="font-medium ml-1">{gameDuration} minutes</span>
                </div>
              )}
              <div>
                <span className="text-blue-700">Winning Margin:</span>
                <span className="font-medium ml-1">
                  {finalStandings[0].totalScore - (finalStandings[1]?.totalScore || 0)} points
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Toggle */}
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
          >
            {showStats ? 'Hide' : 'Show'} Detailed Player Statistics
          </button>
        </div>

        {/* Detailed Player Stats */}
        {showStats && (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Player Statistics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      <th className="text-center p-2">Bid Accuracy</th>
                      <th className="text-center p-2">Best Round</th>
                      <th className="text-center p-2">Worst Round</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.map((stats) => (
                      <tr key={stats.player.id} className="border-b">
                        <td className="p-2 font-medium">{stats.player.name}</td>
                        <td className="text-center p-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            stats.accuracyRate >= 70 ? 'bg-green-100 text-green-800' :
                            stats.accuracyRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {stats.accuracyRate}% ({stats.correctBids}/{stats.totalBids})
                          </span>
                        </td>
                        <td className="text-center p-2 text-green-600 font-medium">
                          +{stats.highestSingleRound}
                        </td>
                        <td className="text-center p-2 text-red-600 font-medium">
                          {stats.lowestSingleRound}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 rounded-b-lg">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onViewScores}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              View Detailed Scores
            </button>
            <button
              onClick={onNewGame}
              className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Start New Game
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}