'use client'
import { useState } from 'react'
import { usePlayers, useGames, useStorageInit } from '@/hooks/useLocalStorage'
import { Game } from '@/types/storage'
import { calculateGameRounds } from '@/lib/utils'
import { generateId } from '@/lib/uuid'

export default function StorageTest() {
  const { isInitialized, error: initError } = useStorageInit()
  const { players, loading: playersLoading, addPlayer } = usePlayers()
  const { games, loading: gamesLoading, saveGame } = useGames()
  
  const [testPlayerName, setTestPlayerName] = useState('')
  const [testResult, setTestResult] = useState<string>('')

  const handleTestAddPlayer = async () => {
    if (!testPlayerName.trim()) return
    
    try {
      const newPlayer = await addPlayer({
        name: testPlayerName.trim(),
        createdAt: new Date().toISOString()
      })
      setTestResult(`✅ Player added: ${newPlayer.name} (ID: ${newPlayer.id})`)
      setTestPlayerName('')
    } catch (error) {
      setTestResult(`❌ Failed to add player: ${error}`)
    }
  }

  const handleTestCreateGame = async () => {
    if (players.length < 3) {
      setTestResult('❌ Need at least 3 players to create a game')
      return
    }
    
    try {
      const selectedPlayers = players.slice(0, 4) // Take first 4 players
      const gameId = generateId()
      
      const testGame: Game = {
        id: gameId,
        createdAt: new Date().toISOString(),
        status: 'setup',
        playerCount: selectedPlayers.length,
        totalRounds: calculateGameRounds(selectedPlayers.length),
        currentRound: 1,
        players: selectedPlayers.map((player, index) => ({
          playerId: player.id,
          playerName: player.name,
          totalScore: 0,
          seatPosition: index + 1
        })),
        rounds: []
      }
      
      await saveGame(testGame)
      setTestResult(`✅ Game created with ${selectedPlayers.length} players (ID: ${gameId})`)
    } catch (error) {
      setTestResult(`❌ Failed to create game: ${error}`)
    }
  }

  if (!isInitialized) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-bold text-yellow-800 mb-4">Storage Test</h2>
        {initError ? (
          <p className="text-red-600">❌ Storage initialization failed: {initError}</p>
        ) : (
          <p className="text-yellow-700">🔄 Initializing storage...</p>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Storage Test</h2>
      
      {/* Storage Status */}
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800">✅ Storage initialized successfully!</p>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className="p-4 bg-gray-50 border rounded">
          <p className="text-sm font-mono">{testResult}</p>
        </div>
      )}

      {/* Add Player Test */}
      <div className="space-y-2">
        <h3 className="font-semibold">Test Add Player</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={testPlayerName}
            onChange={(e) => setTestPlayerName(e.target.value)}
            placeholder="Enter player name"
            className="px-3 py-2 border border-gray-300 rounded flex-1"
          />
          <button
            onClick={handleTestAddPlayer}
            disabled={!testPlayerName.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Add Player
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-2">
        <h3 className="font-semibold">Players ({players.length})</h3>
        {playersLoading ? (
          <p className="text-gray-500">Loading players...</p>
        ) : (
          <ul className="space-y-1">
            {players.map(player => (
              <li key={player.id} className="text-sm bg-gray-50 p-2 rounded">
                {player.name} <span className="text-gray-500">({player.id})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Test Create Game */}
      <div className="space-y-2">
        <h3 className="font-semibold">Test Create Game</h3>
        <button
          onClick={handleTestCreateGame}
          disabled={players.length < 3}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          Create Test Game
        </button>
      </div>

      {/* Games List */}
      <div className="space-y-2">
        <h3 className="font-semibold">Games ({games.length})</h3>
        {gamesLoading ? (
          <p className="text-gray-500">Loading games...</p>
        ) : (
          <ul className="space-y-1">
            {games.map(game => (
              <li key={game.id} className="text-sm bg-gray-50 p-2 rounded">
                {game.players.length} players, Status: {game.status}
                <span className="text-gray-500 block">({game.id})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}