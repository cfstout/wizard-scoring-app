'use client'
import { useState, useEffect } from 'react'
import { calculateRemainingTricks } from '@/lib/utils'

interface Player {
  id: string
  name: string
  totalScore: number
}

interface Game {
  id: string
  currentRound: number
  totalRounds: number
  playerCount: number
  status: string
  players: Array<{
    player: Player
    totalScore: number
  }>
}

interface Round {
  id: string
  roundNumber: number
  cardsPerPlayer: number
  trumpSuit?: string
  status: string
}

interface GameBoardProps {
  gameId: string
  onGameEnd: () => void
}

export default function GameBoard({ gameId, onGameEnd }: GameBoardProps) {
  const [game, setGame] = useState<Game | null>(null)
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [bids, setBids] = useState<{ [playerId: string]: number }>({})
  const [tricksTaken, setTricksTaken] = useState<{ [playerId: string]: number }>({})
  const [trumpSuit, setTrumpSuit] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchGame()
  }, [gameId])

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`)
      const gameData = await response.json()
      setGame(gameData)
      
      if (gameData.status === 'SETUP') {
        await startNextRound(gameData)
      }
    } catch (error) {
      console.error('Failed to fetch game:', error)
    }
  }

  const startNextRound = async (gameData: Game) => {
    const roundNumber = gameData.currentRound
    const cardsPerPlayer = roundNumber
    
    try {
      console.log('Creating round:', { gameId: gameData.id, roundNumber, cardsPerPlayer })
      
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameData.id,
          roundNumber,
          cardsPerPlayer,
          trumpSuit: trumpSuit || null
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Round creation failed:', response.status, errorText)
        throw new Error(`Failed to create round: ${response.status}`)
      }
      
      const round = await response.json()
      setCurrentRound(round)
      
      // Reset bids and tricks for new round
      setBids({})
      setTricksTaken({})
      setTrumpSuit('')
    } catch (error) {
      console.error('Failed to start round:', error)
    }
  }

  const handleBidChange = (playerId: string, bid: number) => {
    setBids(prev => ({ ...prev, [playerId]: bid }))
  }

  const handleTricksChange = (playerId: string, tricks: number) => {
    setTricksTaken(prev => ({ ...prev, [playerId]: tricks }))
  }

  const submitBids = async () => {
    if (!currentRound || !game) return

    setLoading(true)
    try {
      // Create bids
      const bidPromises = game.players.map(({ player }) => 
        fetch('/api/bids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundId: currentRound.id,
            playerId: player.id,
            bidAmount: bids[player.id] || 0
          })
        })
      )
      
      await Promise.all(bidPromises)
      
      // Update round status to PLAYING using the individual round endpoint
      const updateResponse = await fetch(`/api/rounds/${currentRound.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'PLAYING', 
          trumpSuit: trumpSuit || null 
        })
      })
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error('Failed to update round status:', updateResponse.status, errorText)
        throw new Error(`Failed to update round: ${updateResponse.status}`)
      }
      
      setCurrentRound(prev => prev ? { 
        ...prev, 
        status: 'PLAYING', 
        trumpSuit: trumpSuit || undefined 
      } : null)
    } catch (error) {
      console.error('Failed to submit bids:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeRound = async () => {
    if (!currentRound || !game) return

    setLoading(true)
    try {
      // Use the PATCH endpoint for completing rounds (not POST)
      const response = await fetch('/api/rounds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: currentRound.id,
          bids: game.players.map(({ player }) => ({
            playerId: player.id,
            bidAmount: bids[player.id] || 0
          })),
          tricksTaken
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to complete round:', response.status, errorText)
        throw new Error(`Failed to complete round: ${response.status}`)
      }

      // Refresh game data to get updated scores
      const gameResponse = await fetch(`/api/games/${gameId}`)
      const updatedGameData = await gameResponse.json()
      setGame(updatedGameData)

      // Check if game is complete
      if (updatedGameData.currentRound > updatedGameData.totalRounds) {
        onGameEnd()
      } else {
        // Start next round
        await startNextRound(updatedGameData)
      }
    } catch (error) {
      console.error('Failed to complete round:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!game || !currentRound) {
    return <div className="p-4">Loading game...</div>
  }

  const allBidsEntered = game.players.every(({ player }) => 
    bids[player.id] !== undefined
  )
  
  const allTricksEntered = game.players.every(({ player }) => 
    tricksTaken[player.id] !== undefined
  )

  const totalBids = Object.values(bids).reduce((sum, bid) => sum + (bid || 0), 0)
  const remainingTricks = calculateRemainingTricks(currentRound.cardsPerPlayer, Object.values(bids))

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Wizard Game</h1>
        <p className="text-gray-600">
          Round {currentRound.roundNumber} of {game.totalRounds} 
          ({currentRound.cardsPerPlayer} card{currentRound.cardsPerPlayer !== 1 ? 's' : ''} each)
        </p>
        {currentRound.trumpSuit && (
          <p className="text-lg font-semibold">Trump: {currentRound.trumpSuit}</p>
        )}
      </div>

      {/* Current Standings */}
      {currentRound.roundNumber > 1 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-center">Current Standings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...game.players]
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((playerGame, index) => (
                <div key={playerGame.player.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">#{index + 1}</span>
                    <span className="font-medium text-sm">{playerGame.player.name}</span>
                    {index === 0 && (
                      <span className="text-yellow-500">👑</span>
                    )}
                  </div>
                  <span className="font-bold text-sm">{playerGame.totalScore}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {currentRound.status === 'BIDDING' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Bidding Phase</h2>
          
          {!currentRound.trumpSuit && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Trump Suit (optional):
              </label>
              <select
                value={trumpSuit}
                onChange={(e) => setTrumpSuit(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">No Trump</option>
                <option value="Hearts">Hearts</option>
                <option value="Diamonds">Diamonds</option>
                <option value="Clubs">Clubs</option>
                <option value="Spades">Spades</option>
              </select>
            </div>
          )}

          <div className="grid gap-4">
            {game.players.map(({ player }) => (
              <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{player.name}</span>
                <div className="flex items-center space-x-2">
                  <span>Bid:</span>
                  <input
                    type="number"
                    min="0"
                    max={currentRound.cardsPerPlayer}
                    value={bids[player.id] ?? ''}
                    onChange={(e) => handleBidChange(player.id, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p>Total Bids: {totalBids} | Cards: {currentRound.cardsPerPlayer}</p>
            <p className={`font-semibold ${remainingTricks === 0 ? 'text-green-600' : remainingTricks > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              Remaining Tricks: {remainingTricks}
            </p>
          </div>

          <button
            onClick={submitBids}
            disabled={!allBidsEntered || loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Bids'}
          </button>
        </div>
      )}

      {currentRound.status === 'PLAYING' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Playing Phase</h2>
          
          <div className="grid gap-4">
            {game.players.map(({ player }) => (
              <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{player.name}</span>
                  <span className="ml-2 text-gray-600">
                    (Bid: {bids[player.id] || 0})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Tricks Taken:</span>
                  <input
                    type="number"
                    min="0"
                    max={currentRound.cardsPerPlayer}
                    value={tricksTaken[player.id] ?? ''}
                    onChange={(e) => handleTricksChange(player.id, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={completeRound}
            disabled={!allTricksEntered || loading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Completing Round...' : 'Complete Round'}
          </button>
        </div>
      )}
    </div>
  )
}