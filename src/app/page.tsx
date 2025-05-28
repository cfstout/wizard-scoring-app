'use client'
import { useState } from 'react'
import PlayerForm from './components/PlayerForm'
import GameSetup from './components/GameSetup'
import GameBoard from './components/GameBoard'
import ScoreBoard from './components/ScoreBoard'

type AppState = 'setup' | 'game' | 'scores'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('setup')
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  const [refreshPlayers, setRefreshPlayers] = useState(0)

  const handlePlayerCreated = () => {
    setRefreshPlayers(prev => prev + 1)
  }

  const handleGameCreated = (gameId: string) => {
    setCurrentGameId(gameId)
    setAppState('game')
  }

  const handleGameEnd = () => {
    setAppState('scores')
  }

  const handleNewGame = () => {
    setCurrentGameId(null)
    setAppState('setup')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {appState === 'setup' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Wizard Card Game Scorer</h1>
              <p className="text-gray-600 mt-2">Track scores for the Wizard card game</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Add New Player</h2>
              <PlayerForm onPlayerCreated={handlePlayerCreated} />
            </div>
            
            <div className="bg-white rounded-lg shadow p-6" key={refreshPlayers}>
              <GameSetup onGameCreated={handleGameCreated} />
            </div>
          </div>
        )}

        {appState === 'game' && currentGameId && (
          <div className="bg-white rounded-lg shadow p-6">
            <GameBoard gameId={currentGameId} onGameEnd={handleGameEnd} />
          </div>
        )}

        {appState === 'scores' && currentGameId && (
          <div className="space-y-4">
            <ScoreBoard gameId={currentGameId} />
            <div className="text-center">
              <button
                onClick={handleNewGame}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Start New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}