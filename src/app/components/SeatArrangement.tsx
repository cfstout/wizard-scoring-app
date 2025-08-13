'use client'
import { useState, useEffect, useCallback } from 'react'
import { useGames, usePlayers } from '@/hooks/useLocalStorage'
import { Game, Player } from '@/types/storage'


interface SeatArrangementProps {
  gameId: string
  onSeatsArranged: () => void
}

export default function SeatArrangement({ gameId, onSeatsArranged }: SeatArrangementProps) {
  const { getGame, saveGame } = useGames()
  const { players: allPlayers } = usePlayers()
  const [game, setGame] = useState<Game | null>(null)
  const [seats, setSeats] = useState<(Player | null)[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)

  const fetchGame = useCallback(async () => {
    try {
      const gameData = await getGame(gameId)
      if (gameData) {
        setGame(gameData)

        // Initialize seats array
        const seatArray = new Array(gameData.playerCount).fill(null)
        
        // Get actual player objects from the players list
        const gamePlayers = gameData.players
          .map(gp => allPlayers.find(p => p.id === gp.playerId))
          .filter((p): p is Player => p !== undefined)

        setSeats(seatArray)
        setAvailablePlayers(gamePlayers)
      }
    } catch (error) {
      console.error('Failed to fetch game:', error)
    }
  }, [gameId, getGame, allPlayers])

  useEffect(() => {
    fetchGame()
  }, [fetchGame])

  const assignPlayerToSeat = (player: Player, seatIndex: number) => {
    // Remove player from their current seat if they have one
    const newSeats = seats.map(seat => (seat?.id === player.id ? null : seat))

    // Assign player to new seat
    newSeats[seatIndex] = player
    setSeats(newSeats)

    // Update available players
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))
  }

  const removePlayerFromSeat = (seatIndex: number) => {
    const player = seats[seatIndex]
    if (player) {
      const newSeats = [...seats]
      newSeats[seatIndex] = null
      setSeats(newSeats)

      setAvailablePlayers(prev => [...prev, player])
    }
  }

  const handleStartGame = async () => {
    if (seats.some(seat => seat === null)) {
      alert('Please assign all players to seats before starting the game.')
      return
    }

    setLoading(true)
    try {
      if (!game) return

      // Update game with seat positions and change status
      const updatedGame: Game = {
        ...game,
        status: 'in_progress',
        players: game.players.map(gp => {
          const seatIndex = seats.findIndex(seat => seat?.id === gp.playerId)
          return {
            ...gp,
            seatPosition: seatIndex >= 0 ? seatIndex + 1 : undefined,
          }
        }),
      }

      await saveGame(updatedGame)

      onSeatsArranged()
    } catch (error) {
      console.error('Failed to save seat arrangement:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!game) {
    return <div className="p-4">Loading...</div>
  }

  const allSeatsAssigned = seats.every(seat => seat !== null)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Arrange Seats</h1>
        <p className="text-gray-600 mt-2">
          Drag players to seats or click a player then click a seat
        </p>
      </div>

      {/* Seat Layout */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Table Seating</h2>

        {/* Visual seat arrangement - circular layout */}
        <div className="relative w-80 h-80 mx-auto mb-6">
          {seats.map((player, index) => {
            // Calculate position for circular layout
            const angle = (index * 360) / game.playerCount - 90 // Start at top
            const radius = 120
            const x = Math.cos((angle * Math.PI) / 180) * radius
            const y = Math.sin((angle * Math.PI) / 180) * radius

            return (
              <div
                key={index}
                className={`absolute w-16 h-16 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                  player
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                }`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                }}
                onClick={() => {
                  if (player) {
                    removePlayerFromSeat(index)
                  }
                }}
                title={player ? `Click to remove ${player.name}` : `Seat ${index + 1}`}
              >
                {player ? (
                  <div className="text-center">
                    <div className="text-xs leading-tight">{player.name}</div>
                    <div className="text-xs opacity-75">#{index + 1}</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-lg">🪑</div>
                    <div className="text-xs">#{index + 1}</div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Table center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-green-800 rounded-full flex items-center justify-center text-white font-bold">
              TABLE
            </div>
          </div>
        </div>

        {/* Available Players */}
        {availablePlayers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Players</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {availablePlayers.map(player => (
                <button
                  key={player.id}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  onClick={() => {
                    // Find first empty seat
                    const emptySeatIndex = seats.findIndex(seat => seat === null)
                    if (emptySeatIndex !== -1) {
                      assignPlayerToSeat(player, emptySeatIndex)
                    }
                  }}
                >
                  {player.name}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Click a player to assign them to the next available seat
            </p>
          </div>
        )}
      </div>

      {/* Seat Assignment List (alternative interface) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-3">Seat Assignments</h3>
        <div className="grid gap-2">
          {seats.map((player, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Seat {index + 1}:</span>
              <div className="flex items-center space-x-2">
                {player ? (
                  <>
                    <span className="text-blue-600 font-medium">{player.name}</span>
                    <button
                      onClick={() => removePlayerFromSeat(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400">Empty</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800">Game Rules Reminder:</h3>
        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
          <li>• The dealer rotates clockwise each round</li>
          <li>• The player to the left of the dealer bids first</li>
          <li>• Seat positions determine the order for the entire game</li>
        </ul>
      </div>

      {/* Start Game Button */}
      <div className="text-center">
        <button
          onClick={handleStartGame}
          disabled={!allSeatsAssigned || loading}
          className="px-8 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 font-semibold"
        >
          {loading ? 'Starting Game...' : 'Start Game'}
        </button>
        {!allSeatsAssigned && (
          <p className="text-red-600 text-sm mt-2">
            All seats must be assigned before starting the game
          </p>
        )}
      </div>
    </div>
  )
}
