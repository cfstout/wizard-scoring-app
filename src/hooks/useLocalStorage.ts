import { useState, useEffect } from 'react'
import { storageService } from '@/lib/storage-web'
import { Player, Game, PlayerStats } from '@/types/storage'

// Hook for managing players
export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchPlayers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await storageService.getPlayers()
      setPlayers(data)
    } catch (err) {
      console.error('Failed to fetch players:', err)
      setError('Failed to fetch players')
    } finally {
      setLoading(false)
    }
  }
  
  const addPlayer = async (playerData: Omit<Player, 'id'>) => {
    try {
      const newPlayer = await storageService.addPlayer(playerData)
      setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)))
      return newPlayer
    } catch (err) {
      console.error('Failed to add player:', err)
      throw err
    }
  }
  
  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    try {
      const updatedPlayer = await storageService.updatePlayer(id, updates)
      setPlayers(prev => 
        prev.map(p => p.id === id ? updatedPlayer : p)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      return updatedPlayer
    } catch (err) {
      console.error('Failed to update player:', err)
      throw err
    }
  }
  
  const deletePlayer = async (id: string) => {
    try {
      await storageService.deletePlayer(id)
      setPlayers(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Failed to delete player:', err)
      throw err
    }
  }
  
  useEffect(() => {
    fetchPlayers()
  }, [])
  
  return {
    players,
    loading,
    error,
    addPlayer,
    updatePlayer,
    deletePlayer,
    refetch: fetchPlayers
  }
}

// Hook for managing games
export function useGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchGames = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await storageService.getGames()
      setGames(data)
    } catch (err) {
      console.error('Failed to fetch games:', err)
      setError('Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }
  
  const saveGame = async (game: Game) => {
    try {
      const savedGame = await storageService.saveGame(game)
      setGames(prev => {
        const index = prev.findIndex(g => g.id === game.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = savedGame
          return updated
        }
        return [savedGame, ...prev]
      })
      return savedGame
    } catch (err) {
      console.error('Failed to save game:', err)
      throw err
    }
  }
  
  const deleteGame = async (id: string) => {
    try {
      await storageService.deleteGame(id)
      setGames(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      console.error('Failed to delete game:', err)
      throw err
    }
  }
  
  const getGame = async (id: string): Promise<Game | null> => {
    try {
      return await storageService.getGame(id)
    } catch (err) {
      console.error('Failed to get game:', err)
      return null
    }
  }
  
  useEffect(() => {
    fetchGames()
  }, [])
  
  return {
    games,
    loading,
    error,
    saveGame,
    deleteGame,
    getGame,
    refetch: fetchGames
  }
}

// Hook for a single game (useful for GameBoard component)
export function useGame(gameId: string | null) {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchGame = async () => {
    if (!gameId) {
      setGame(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const data = await storageService.getGame(gameId)
      setGame(data)
    } catch (err) {
      console.error('Failed to fetch game:', err)
      setError('Failed to fetch game')
    } finally {
      setLoading(false)
    }
  }
  
  const updateGame = async (gameData: Game) => {
    try {
      const updatedGame = await storageService.saveGame(gameData)
      setGame(updatedGame)
      return updatedGame
    } catch (err) {
      console.error('Failed to update game:', err)
      throw err
    }
  }
  
  useEffect(() => {
    fetchGame()
  }, [gameId])
  
  return {
    game,
    loading,
    error,
    updateGame,
    refetch: fetchGame
  }
}

// Hook for player statistics
export function usePlayerStats() {
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await storageService.getPlayerStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch player stats:', err)
      setError('Failed to fetch player stats')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// Hook for storage initialization
export function useStorageInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const initializeStorage = async () => {
    try {
      await storageService.initialize()
      setIsInitialized(true)
    } catch (err) {
      console.error('Failed to initialize storage:', err)
      setError('Failed to initialize storage')
    }
  }
  
  useEffect(() => {
    initializeStorage()
  }, [])
  
  return {
    isInitialized,
    error,
    retry: initializeStorage
  }
}