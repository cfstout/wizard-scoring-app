'use client'
import { useState, useEffect } from 'react'

interface Player {
  id: string
  name: string
}

interface GameSetupProps {
  onGameCreated: (gameId: string) => void
}

export default function GameSetup({ onGameCreated }: GameSetupProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players')
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error('Failed to fetch players:', error)
    }
  }

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const handleCreateGame = async () => {
    if (selectedPlayers.length < 3 || selectedPlayers.length > 6) return

    setLoading(true)
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: selectedPlayers })
      })

      const game = await response.json()
      if (response.ok) {
        // Update game status to SEAT_ARRANGEMENT
        await fetch(`/api/games/${game.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SEAT_ARRANGEMENT' })
        })
        
        onGameCreated(game.id)
      }
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
            ({selectedPlayers.length === 3 ? '20' : 
              selectedPlayers.length === 4 ? '15' : 
              selectedPlayers.length === 5 ? '12' : '10'} rounds)
          </span>
        )}
      </div>

      {selectedPlayers.length >= 3 && (
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <strong>Next:</strong> You'll arrange the seating order to determine dealer rotation and bidding order.
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