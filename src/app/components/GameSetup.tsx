'use client'
import { useState } from 'react'
import { usePlayers, useGames } from '@/hooks/useLocalStorage'
import { Player, Game, GamePlayer } from '@/types/storage'
import { generateId } from '@/lib/uuid'
import { calculateGameRounds } from '@/lib/utils'

interface GameSetupProps {
  onGameCreated: (gameId: string) => void
}

export default function GameSetup({ onGameCreated }: GameSetupProps) {
  const { players } = usePlayers()
  const { saveGame } = useGames()
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    )
  }

  const handleCreateGame = async () => {
    if (selectedPlayers.length < 3 || selectedPlayers.length > 6) return

    setLoading(true)
    try {
      const gameId = generateId()
      const playerCount = selectedPlayers.length
      const totalRounds = calculateGameRounds(playerCount)

      // Create game players with initial data
      const gamePlayers: GamePlayer[] = selectedPlayers.map(playerId => ({
        playerId,
        totalScore: 0,
      }))

      const newGame: Game = {
        id: gameId,
        createdAt: new Date().toISOString(),
        status: 'seat_arrangement',
        playerCount,
        totalRounds,
        currentRound: 1,
        players: gamePlayers,
        rounds: [],
      }

      await saveGame(newGame)
      onGameCreated(gameId)
    } catch (error) {
      console.error('Failed to create game:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Select Players (3-6 required)</h2>

      <div className="grid grid-cols-2 gap-2">
        {players.map(player => (
          <label key={player.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedPlayers.includes(player.id)}
              onChange={() => handlePlayerToggle(player.id)}
              className="rounded"
            />
            <span>{player.name}</span>
          </label>
        ))}
      </div>

      <div className="text-sm text-gray-600">
        Selected: {selectedPlayers.length}/6 players
        {selectedPlayers.length >= 3 && (
          <span className="ml-2 text-green-600">
            (
            {selectedPlayers.length === 3
              ? '20'
              : selectedPlayers.length === 4
                ? '15'
                : selectedPlayers.length === 5
                  ? '12'
                  : '10'}{' '}
            rounds)
          </span>
        )}
      </div>

      {selectedPlayers.length >= 3 && (
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <strong>Next:</strong> You&apos;ll arrange the seating order to determine dealer rotation
          and bidding order.
        </div>
      )}

      <button
        onClick={handleCreateGame}
        disabled={loading || selectedPlayers.length < 3 || selectedPlayers.length > 6}
        className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? 'Creating Game...' : 'Continue to Seat Arrangement'}
      </button>
    </div>
  )
}
