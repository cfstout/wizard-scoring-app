import { useState, useEffect } from 'react'
import { webStorageService } from '@/lib/storage-web'
import { Player, Game } from '@/types/storage'

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlayers = async () => {
    setLoading(true)
    try {
      const data = await webStorageService.getPlayers()
      setPlayers(data)
    } catch (error) {
      console.error('Failed to fetch players:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPlayer = async (playerData: Omit<Player, 'id'>) => {
    try {
      const newPlayer = await webStorageService.addPlayer(playerData)
      setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)))
      return newPlayer
    } catch (error) {
      console.error('Failed to add player:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  return { players, loading, addPlayer, refreshPlayers: fetchPlayers }
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGames = async () => {
    setLoading(true)
    try {
      const data = await webStorageService.getGames()
      setGames(data)
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveGame = async (game: Game) => {
    try {
      const savedGame = await webStorageService.saveGame(game)
      await fetchGames() // Refresh the list
      return savedGame
    } catch (error) {
      console.error('Failed to save game:', error)
      throw error
    }
  }

  const getGame = async (id: string): Promise<Game | null> => {
    try {
      return await webStorageService.getGame(id)
    } catch (error) {
      console.error('Failed to get game:', error)
      return null
    }
  }

  const deleteGame = async (id: string) => {
    try {
      await webStorageService.deleteGame(id)
      await fetchGames() // Refresh the list
    } catch (error) {
      console.error('Failed to delete game:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchGames()
  }, [])

  return { games, loading, saveGame, getGame, deleteGame, refreshGames: fetchGames }
}
