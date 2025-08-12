// Web-compatible mock implementation for testing storage in browser
import { Player, Game, AppSettings, PlayerStats } from '@/types/storage'

class WebStorageService {
  private isInitialized = false
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      // Initialize IndexedDB for web testing
      console.log('Initializing web storage service...')
      this.isInitialized = true
      console.log('Web storage service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize web storage service:', error)
      throw error
    }
  }
  
  // Settings methods (using localStorage)
  async getSettings(): Promise<AppSettings> {
    try {
      const stored = localStorage.getItem('wizard-app-settings')
      return stored ? JSON.parse(stored) : { version: '1.0.0' }
    } catch (error) {
      console.error('Failed to get settings:', error)
      return { version: '1.0.0' }
    }
  }
  
  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const current = await this.getSettings()
      const updated = { ...current, ...settings }
      localStorage.setItem('wizard-app-settings', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }
  
  // Player methods (using localStorage)
  async getPlayers(): Promise<Player[]> {
    try {
      const stored = localStorage.getItem('wizard-players')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get players:', error)
      return []
    }
  }
  
  async addPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
    const player: Player = {
      id: crypto.randomUUID(),
      ...playerData
    }
    
    try {
      const players = await this.getPlayers()
      const updated = [...players, player].sort((a, b) => a.name.localeCompare(b.name))
      localStorage.setItem('wizard-players', JSON.stringify(updated))
      return player
    } catch (error) {
      console.error('Failed to add player:', error)
      throw error
    }
  }
  
  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    try {
      const players = await this.getPlayers()
      const index = players.findIndex(p => p.id === id)
      if (index === -1) throw new Error('Player not found')
      
      const updatedPlayer = { ...players[index], ...updates }
      players[index] = updatedPlayer
      localStorage.setItem('wizard-players', JSON.stringify(players))
      return updatedPlayer
    } catch (error) {
      console.error('Failed to update player:', error)
      throw error
    }
  }
  
  async deletePlayer(id: string): Promise<void> {
    try {
      const players = await this.getPlayers()
      const filtered = players.filter(p => p.id !== id)
      localStorage.setItem('wizard-players', JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to delete player:', error)
      throw error
    }
  }
  
  // Game methods (using localStorage)
  async saveGame(game: Game): Promise<Game> {
    try {
      const games = await this.getGames()
      const index = games.findIndex(g => g.id === game.id)
      
      if (index >= 0) {
        games[index] = game
      } else {
        games.unshift(game) // Add to beginning for newest first
      }
      
      localStorage.setItem('wizard-games', JSON.stringify(games))
      return game
    } catch (error) {
      console.error('Failed to save game:', error)
      throw error
    }
  }
  
  async getGames(): Promise<Game[]> {
    try {
      const stored = localStorage.getItem('wizard-games')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get games:', error)
      return []
    }
  }
  
  async getGame(id: string): Promise<Game | null> {
    try {
      const games = await this.getGames()
      return games.find(g => g.id === id) || null
    } catch (error) {
      console.error('Failed to get game:', error)
      return null
    }
  }
  
  async deleteGame(id: string): Promise<void> {
    try {
      const games = await this.getGames()
      const filtered = games.filter(g => g.id !== id)
      localStorage.setItem('wizard-games', JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to delete game:', error)
      throw error
    }
  }
  
  // Stats methods
  async getPlayerStats(): Promise<PlayerStats[]> {
    try {
      const games = await this.getGames()
      const completedGames = games.filter(game => game.status === 'completed')
      
      const playerStatsMap = new Map<string, PlayerStats>()
      
      completedGames.forEach(game => {
        game.players.forEach(gamePlayer => {
          const existing = playerStatsMap.get(gamePlayer.playerId) || {
            playerId: gamePlayer.playerId,
            playerName: gamePlayer.playerName,
            gamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            averageScore: 0,
            winRate: 0
          }
          
          existing.gamesPlayed += 1
          existing.totalScore += gamePlayer.totalScore
          
          // Check if this player won (assuming position 1 is winner)
          if (gamePlayer.position === 1) {
            existing.gamesWon += 1
          }
          
          playerStatsMap.set(gamePlayer.playerId, existing)
        })
      })
      
      // Calculate averages and win rates
      return Array.from(playerStatsMap.values()).map(stats => ({
        ...stats,
        averageScore: stats.gamesPlayed > 0 ? stats.totalScore / stats.gamesPlayed : 0,
        winRate: stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0
      }))
    } catch (error) {
      console.error('Failed to get player stats:', error)
      return []
    }
  }
  
  async close(): Promise<void> {
    this.isInitialized = false
  }
}

// Detect environment and export appropriate service
const isWeb = typeof window !== 'undefined' && !window.Capacitor

export const storageService = isWeb 
  ? new WebStorageService()
  : new (require('./storage').WizardStorageService)()